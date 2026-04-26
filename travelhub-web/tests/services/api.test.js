// Unit tests for src/services/api.js
//
// We can't import the private header builders directly (they're not
// exported), so we test through the public surface — `publicFetch`,
// `authFetch`, `registerUser`, `loginUser` — by stubbing `globalThis.fetch`
// and inspecting how the module called it.
//
// This locks in the contract our mobile parity audit cares about:
//   - Every request carries `X-Guest-Id` (read or generated from
//     localStorage `travelhub_guest_id`).
//   - Authenticated calls add `Authorization: Bearer <jwt>` when a token
//     is in storage, and skip it otherwise.
//   - `/auth/register` and `/auth/login` always go via raw `fetch` and
//     never carry `Authorization` (so a stale token doesn't leak through
//     while the user is rotating credentials).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AUTH_TOKEN_KEY } from "../../src/auth/sessionAuth";

// Importing api.js under a fresh module registry per-test would force us
// into vi.resetModules() gymnastics. Instead, the module reads tokens via
// `getAuthToken()` (which we set/clear through localStorage) and calls
// `fetch()` (which we replace before each test) — both safe to drive from
// the outside.
import {
  publicFetch,
  authFetch,
  registerUser,
  loginUser,
  buildAccommodationSearchQueryString,
  listUserReservations,
  mapUserReservationDto,
  searchAccommodations,
  getHotelAvailability,
  listHotels,
  getDashboardAnalytics,
  getHotelReservationDetailFromApi,
  createReservation,
  createBooking,
  processPayment,
} from "../../src/services/api";

const GUEST_ID_KEY = "travelhub_guest_id";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  };
}

function lastFetchCall() {
  const calls = globalThis.fetch.mock.calls;
  return calls[calls.length - 1];
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getGuestId (via header propagation)", () => {
  it("generates a guest id on first call and persists it to localStorage", async () => {
    expect(localStorage.getItem(GUEST_ID_KEY)).toBeNull();

    globalThis.fetch.mockResolvedValueOnce(jsonResponse({}));
    await publicFetch("/anything");

    const stored = localStorage.getItem(GUEST_ID_KEY);
    expect(stored).toBeTruthy();
    expect(stored.length).toBeGreaterThan(0);

    const [, init] = lastFetchCall();
    expect(init.headers["X-Guest-Id"]).toBe(stored);
  });

  it("reuses an existing guest id across requests", async () => {
    localStorage.setItem(GUEST_ID_KEY, "fixed-guest-id");

    globalThis.fetch.mockResolvedValue(jsonResponse({}));
    await publicFetch("/a");
    await publicFetch("/b");

    expect(localStorage.getItem(GUEST_ID_KEY)).toBe("fixed-guest-id");
    for (const [, init] of globalThis.fetch.mock.calls) {
      expect(init.headers["X-Guest-Id"]).toBe("fixed-guest-id");
    }
  });
});

describe("publicFetch", () => {
  it("includes X-Guest-Id and Content-Type but never Authorization", async () => {
    localStorage.setItem(GUEST_ID_KEY, "guest-1");
    // Even if a leftover token is present, publicFetch must not send it.
    localStorage.setItem(AUTH_TOKEN_KEY, "should.not.leak");

    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const data = await publicFetch("/accommodations/hotels");

    const [url, init] = lastFetchCall();
    expect(url).toMatch(/\/accommodations\/hotels$/);
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["X-Guest-Id"]).toBe("guest-1");
    expect(init.headers.Authorization).toBeUndefined();
    expect(data).toEqual({ ok: true });
  });

  it("throws an Error with the .status field on non-2xx responses", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.resolve("upstream down"),
    });

    await expect(publicFetch("/x")).rejects.toMatchObject({
      message: expect.stringContaining("503"),
      status: 503,
    });
  });
});

describe("authFetch", () => {
  it("attaches Authorization AND empties X-Guest-Id when a JWT is in storage", async () => {
    localStorage.setItem(GUEST_ID_KEY, "leftover-guest-id");
    localStorage.setItem(AUTH_TOKEN_KEY, "abc.def.ghi");

    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: "r-1" }));
    await authFetch("/reservation-flow/create", {
      method: "POST",
      body: JSON.stringify({ hotel_id: "h1" }),
    });

    const [, init] = lastFetchCall();
    expect(init.headers.Authorization).toBe("Bearer abc.def.ghi");
    // The Bearer token is the authoritative identity; clearing the
    // guest header avoids polluting the user's scope on the backend.
    expect(init.headers["X-Guest-Id"]).toBe("");
    expect(init.method).toBe("POST");
  });

  it("omits Authorization and sends the stored X-Guest-Id when there is no token", async () => {
    localStorage.setItem(GUEST_ID_KEY, "g1");
    // No AUTH_TOKEN_KEY — anonymous user.

    globalThis.fetch.mockResolvedValueOnce(jsonResponse({}));
    await authFetch("/anything");

    const [, init] = lastFetchCall();
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers["X-Guest-Id"]).toBe("g1");
  });

  it("ignores blank token values", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "   ");

    globalThis.fetch.mockResolvedValueOnce(jsonResponse({}));
    await authFetch("/anything");

    const [, init] = lastFetchCall();
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("lets caller override headers without losing the auth headers", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({}));

    await authFetch("/x", { headers: { "X-Trace-Id": "trace-7" } });

    const [, init] = lastFetchCall();
    expect(init.headers["X-Trace-Id"]).toBe("trace-7");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });
});

describe("registerUser", () => {
  it("POSTs JSON body to /auth/register without an Authorization header", async () => {
    // Simulate a stale token: register must NOT send it.
    localStorage.setItem(AUTH_TOKEN_KEY, "stale.token");
    localStorage.setItem(GUEST_ID_KEY, "g-reg");

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            id: "u1",
            email: "a@b.com",
            first_name: "A",
            last_name: "B",
            user_type: "traveler",
            access_token: "new.jwt",
          }),
        ),
    });

    const out = await registerUser({
      email: "a@b.com",
      password: "secret123",
      first_name: "A",
      last_name: "B",
    });

    const [url, init] = lastFetchCall();
    expect(url).toMatch(/\/auth\/register$/);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers["X-Guest-Id"]).toBe("g-reg");

    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      email: "a@b.com",
      password: "secret123",
      first_name: "A",
      last_name: "B",
      user_type: "traveler",
      phone: null,
      country_id: null,
    });
    expect(out.token).toBe("new.jwt");
  });

  it("maps a 409 response to the duplicate-email message", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: () => Promise.resolve("{}"),
    });

    await expect(
      registerUser({
        email: "dup@x.com",
        password: "p",
        first_name: "D",
        last_name: "P",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: expect.stringMatching(/ya está registrado/i),
    });
  });
});

describe("loginUser", () => {
  it("POSTs lowercased trimmed email and returns the access_token", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "stale.token");

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            access_token: "fresh.jwt",
            token_type: "Bearer",
            user_type: "traveler",
          }),
        ),
    });

    const out = await loginUser({ email: "  Foo@Bar.COM ", password: "x" });

    const [url, init] = lastFetchCall();
    expect(url).toMatch(/\/auth\/login$/);
    expect(init.headers.Authorization).toBeUndefined();

    const body = JSON.parse(init.body);
    expect(body.email).toBe("foo@bar.com");
    expect(out.access_token).toBe("fresh.jwt");
  });

  it("maps 401 to the friendly invalid-credentials message", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("{}"),
    });

    await expect(
      loginUser({ email: "x@y.com", password: "wrong" }),
    ).rejects.toMatchObject({
      status: 401,
      message: expect.stringMatching(/Correo o contraseña/i),
    });
  });
});

describe("listUserReservations", () => {
  it("throws 401 immediately when no JWT is in storage (no fetch fired)", async () => {
    await expect(listUserReservations()).rejects.toMatchObject({ status: 401 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("calls GET /reservations/user with limit/offset and Authorization, X-Guest-Id empty", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    localStorage.setItem(GUEST_ID_KEY, "guest-leftover");

    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            id: "r1",
            hotel_id: "h1",
            check_in: "2026-05-01",
            check_out: "2026-05-05",
            guests: 2,
            total_price: "500.00",
            status: "confirmed",
            confirmation_code: "RES1",
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      }),
    );

    const out = await listUserReservations({ limit: 50, offset: 0 });

    const [url, init] = lastFetchCall();
    expect(url).toContain("/reservations/user?");
    expect(url).toContain("limit=50");
    expect(url).toContain("offset=0");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer tok");
    // Confirma el contrato del fix #1: con JWT presente el header guest va vacío.
    expect(init.headers["X-Guest-Id"]).toBe("");

    expect(out.total).toBe(1);
    expect(out.items).toHaveLength(1);
    expect(out.items[0].id).toBe("r1");
  });

  it("defaults to limit=20, offset=0", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ items: [], total: 0 }));

    await listUserReservations();

    const [url] = lastFetchCall();
    expect(url).toContain("limit=20");
    expect(url).toContain("offset=0");
  });

  it("falls back to total = items.length when the backend omits total", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ items: [{ id: "a" }, { id: "b" }] }),
    );

    const out = await listUserReservations();
    expect(out.total).toBe(2);
  });

  it("accepts a bare array body (some backends omit the wrapper)", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([{ id: "r1" }]));

    const out = await listUserReservations();
    expect(out.items).toEqual([{ id: "r1" }]);
    expect(out.total).toBe(1);
  });
});

describe("mapUserReservationDto", () => {
  it("normalizes snake_case fields and computes nights", () => {
    const r = mapUserReservationDto({
      id: "r-1",
      hotel_id: "h-1",
      check_in: "2026-05-01",
      check_out: "2026-05-05",
      guests: 3,
      total_price: "750.00",
      status: "confirmed",
      confirmation_code: "RES-XYZ",
    });

    expect(r).toMatchObject({
      id: "r-1",
      reference: "RES-XYZ",
      checkIn: "2026-05-01",
      checkOut: "2026-05-05",
      nights: 4,
      guests: 3,
      total: 750,
      status: "confirmed",
      source: "backend",
    });
    // Sin map de hoteles, fallback a "Alojamiento" — coincide con el render
    // por defecto de la card cuando no hay datos del hotel.
    expect(r.hotel.name).toBe("Alojamiento");
    expect(r.hotel.location).toBe("—");
  });

  it("resolves hotel name+location from the provided hotelsById map", () => {
    const hotelsById = new Map([
      [
        "h-1",
        {
          id: "h-1",
          name: "Casa Sol",
          location: "Lima, Perú",
          rating: 4.5,
        },
      ],
    ]);
    const r = mapUserReservationDto(
      {
        id: "r-1",
        hotel_id: "h-1",
        check_in: "2026-05-01",
        check_out: "2026-05-05",
        guests: 2,
        total_price: 500,
        confirmation_code: "RES1",
      },
      hotelsById,
    );

    expect(r.hotel.name).toBe("Casa Sol");
    expect(r.hotel.location).toBe("Lima, Perú");
    expect(r.hotel.rating).toBe(4.5);
  });

  it("returns null nights when dates are missing or invalid", () => {
    expect(mapUserReservationDto({ id: "x" }).nights).toBeNull();
    expect(
      mapUserReservationDto({ check_in: "2026-05-05", check_out: "2026-05-01" })
        .nights,
    ).toBeNull(); // checkout antes que checkin
  });
});

describe("listHotels", () => {
  it("maps the GET /accommodations/hotels response into the app shape", async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse([
        {
          id: "h1",
          name: "Casa Sol",
          city: "Lima",
          rating: "4.5",
          total_reviews: 12,
          stars: 4,
          description: "desc",
          address: "addr",
        },
      ]),
    );

    const out = await listHotels();

    const [url, init] = lastFetchCall();
    expect(url).toMatch(/\/accommodations\/hotels$/);
    // Listings are public — never carry the Bearer header.
    expect(init.headers.Authorization).toBeUndefined();
    expect(out).toEqual([
      expect.objectContaining({
        id: "h1",
        name: "Casa Sol",
        location: "Lima, Perú",
        city: "Lima",
        rating: 4.5,
        reviewsCount: 12,
        stars: 4,
      }),
    ]);
  });

  it("defaults rating to 0 when the response is missing it", async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([{ id: "h1", name: "X", city: "Lima" }]));
    const [hotel] = await listHotels();
    expect(hotel.rating).toBe(0);
  });
});

describe("searchAccommodations", () => {
  it("requires at least one non-empty param (otherwise throws synchronously)", async () => {
    await expect(searchAccommodations({})).rejects.toThrow(
      /Parámetros de búsqueda incompletos/i,
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("hits /accommodations/search with the built query string and maps results", async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({
        result: [
          {
            hotel_id: "h1",
            hotel_name: "Casa Sol",
            city: "Lima",
            rating: "4.5",
            stars: 4,
            available_room_types: [
              {
                id: "rt1",
                name: "Suite",
                max_capacity: 2,
                price_per_night: "100",
                total_price: "400",
                amenities: [{ name: "wifi" }, "tv"],
              },
            ],
          },
        ],
      }),
    );

    const out = await searchAccommodations({ city: "Lima", check_in: "2026-05-01" });

    const [url] = lastFetchCall();
    expect(url).toContain("/accommodations/search?");
    expect(url).toContain("city=Lima");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "h1",
      name: "Casa Sol",
      price: 100,
      stars: 4,
      availableRooms: ["Suite"],
    });
    expect(out[0].amenities).toEqual(expect.arrayContaining(["wifi", "tv"]));
  });

  it("returns an empty list when the backend omits `result`", async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({}));
    expect(await searchAccommodations({ city: "Lima" })).toEqual([]);
  });
});

describe("getHotelAvailability", () => {
  it("encodes check_in/check_out as query params and maps the response", async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({
        hotel_id: "h1",
        hotel_name: "Casa Sol",
        city: "Lima",
        rating: "4.5",
        stars: 4,
        nights: 4,
        available_room_types: [
          {
            id: "rt1",
            name: "Suite",
            max_capacity: 2,
            price_per_night: "100",
            total_price: "400",
            amenities: ["wifi"],
          },
        ],
      }),
    );

    const out = await getHotelAvailability("h1", "2026-05-01", "2026-05-05");

    const [url] = lastFetchCall();
    expect(url).toContain("/accommodations/hotels/h1/availability?");
    expect(url).toContain("check_in=2026-05-01");
    expect(url).toContain("check_out=2026-05-05");
    expect(out).toMatchObject({
      id: "h1",
      name: "Casa Sol",
      nights: 4,
      price: 100,
      availableRooms: ["Suite"],
    });
  });
});

describe("createBooking / processPayment / createReservation", () => {
  it("createBooking POSTs the body to /reservation-flow/create with auth headers", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: "b-1" }));

    await createBooking({ hotel_id: "h1" });

    const [url, init] = lastFetchCall();
    expect(url).toMatch(/\/reservation-flow\/create$/);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("processPayment POSTs to /reservation-flow/payment", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

    await processPayment({ token: "x" });

    const [url, init] = lastFetchCall();
    expect(url).toMatch(/\/reservation-flow\/payment$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ token: "x" });
  });

  it("createReservation builds the canonical body shape and posts it", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: "r-1" }));

    await createReservation({
      hotelId: "h1",
      roomTypeId: "rt1",
      checkIn: "2026-05-01",
      checkOut: "2026-05-05",
      guests: 2,
      totalPrice: 400,
      pricePerNight: 100,
      nights: 4,
      guestFirstName: "Ana",
      guestLastName: "Lopez",
      cardNumber: "4111-1111-1111-1111",
    });

    const [, init] = lastFetchCall();
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      hotel_id: "h1",
      room_type_id: "rt1",
      check_in: "2026-05-01",
      check_out: "2026-05-05",
      guests: 2,
      total_price: "400.00",
      currency_code: "USD",
      primary_guest: expect.objectContaining({
        first_name: "Ana",
        last_name: "Lopez",
      }),
      payment: expect.objectContaining({
        amount: "400.00",
        payment_token: expect.stringContaining("tok_visa_"),
      }),
    });
  });
});

describe("auth-required absolute fetches (analytics + reservation detail)", () => {
  it("getDashboardAnalytics throws 401 immediately when no JWT", async () => {
    await expect(
      getDashboardAnalytics({ startDate: "2026-05-01", endDate: "2026-05-31" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("getDashboardAnalytics validates the date range before hitting the network", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    await expect(getDashboardAnalytics({})).rejects.toMatchObject({ status: 400 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("getDashboardAnalytics rewrites 401/403 into a session-expired message", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve("{}"),
    });

    await expect(
      getDashboardAnalytics({ startDate: "2026-05-01", endDate: "2026-05-31" }),
    ).rejects.toMatchObject({
      status: 403,
      message: expect.stringMatching(/sesión expiró|inicia sesión/i),
    });
  });

  it("getHotelReservationDetailFromApi throws 401 when no token", async () => {
    await expect(
      getHotelReservationDetailFromApi("r-1"),
    ).rejects.toMatchObject({ status: 401 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("getHotelReservationDetailFromApi rejects empty/invalid ids", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    await expect(getHotelReservationDetailFromApi(" ")).rejects.toMatchObject({
      status: 400,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("getHotelReservationDetailFromApi unwraps a `reservation` envelope when present", async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "tok");
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ reservation: { id: "r-1", status: "confirmed" } }),
    );

    const out = await getHotelReservationDetailFromApi("r-1");
    expect(out).toEqual({ id: "r-1", status: "confirmed" });
  });
});

describe("buildAccommodationSearchQueryString", () => {
  it("omits empty / null / undefined params", () => {
    const qs = buildAccommodationSearchQueryString({
      city: "Lima",
      check_in: "2026-05-01",
      check_out: "",
      guests: undefined,
      price_min: null,
    });
    const sp = new URLSearchParams(qs);
    expect(sp.get("city")).toBe("Lima");
    expect(sp.get("check_in")).toBe("2026-05-01");
    expect(sp.has("check_out")).toBe(false);
    expect(sp.has("guests")).toBe(false);
    expect(sp.has("price_min")).toBe(false);
  });

  it("repeats `amenities` once per item and remaps UI keys", () => {
    const qs = buildAccommodationSearchQueryString({
      city: "Lima",
      amenities: ["wifi", "air_conditioning", "pool"],
    });
    const sp = new URLSearchParams(qs);
    // `air_conditioning` from UI → `room_service` in API; the rest pass through.
    expect(sp.getAll("amenities")).toEqual(["wifi", "room_service", "pool"]);
  });

  it("drops min_stars when below 1", () => {
    const qs = buildAccommodationSearchQueryString({ city: "x", min_stars: 0 });
    expect(new URLSearchParams(qs).has("min_stars")).toBe(false);
  });

  it("returns empty string when input is not an object", () => {
    expect(buildAccommodationSearchQueryString(null)).toBe("");
    expect(buildAccommodationSearchQueryString(undefined)).toBe("");
  });
});
