// Unit tests for src/bookings/localReservations.js
//
// The current implementation persists ALL local reservations under a
// single global key (`travelhub-reservations`). That's the bug we're
// about to fix (issue #3 of the web/mobile parity audit): bookings made
// while signed-in must be scoped per user_id so logging in as another
// account doesn't surface stale data.
//
// These tests pin the *current* behavior so the refactor doesn't
// silently regress. New scoping tests will be added alongside the fix.

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LOCAL_RESERVATIONS_KEY,
  appendLocalReservation,
  currentReservationsScopeKey,
  getLocalReservations,
} from "../../src/bookings/localReservations";
import {
  AUTH_TOKEN_KEY,
  persistSessionFromLogin,
  clearSessionUser,
} from "../../src/auth/sessionAuth";

const GUEST_ID_KEY = "travelhub_guest_id";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("getLocalReservations", () => {
  it("returns [] when nothing is stored", () => {
    expect(getLocalReservations()).toEqual([]);
  });

  it("returns the parsed array from localStorage", () => {
    localStorage.setItem(
      LOCAL_RESERVATIONS_KEY,
      JSON.stringify([{ id: "r-1" }, { id: "r-2" }]),
    );
    expect(getLocalReservations()).toEqual([{ id: "r-1" }, { id: "r-2" }]);
  });

  it("returns [] when the stored value is malformed JSON", () => {
    localStorage.setItem(LOCAL_RESERVATIONS_KEY, "{not-json");
    expect(getLocalReservations()).toEqual([]);
  });

  it("returns [] when the stored value is JSON but not an array", () => {
    localStorage.setItem(LOCAL_RESERVATIONS_KEY, JSON.stringify({ a: 1 }));
    expect(getLocalReservations()).toEqual([]);
  });
});

describe("appendLocalReservation", () => {
  it("prepends new entries (most recent first) and stamps savedAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T10:00:00Z"));

    appendLocalReservation({ id: "r-1", hotel: "Hotel A" });

    vi.setSystemTime(new Date("2026-01-03T11:00:00Z"));
    appendLocalReservation({ id: "r-2", hotel: "Hotel B" });

    const list = getLocalReservations();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({
      id: "r-2",
      hotel: "Hotel B",
      savedAt: "2026-01-03T11:00:00.000Z",
    });
    expect(list[1]).toMatchObject({
      id: "r-1",
      savedAt: "2026-01-02T10:00:00.000Z",
    });

    vi.useRealTimers();
  });

  it("does not mutate the entry passed in (callers may reuse the object)", () => {
    const entry = { id: "r-1" };
    appendLocalReservation(entry);
    expect(entry).toEqual({ id: "r-1" });
    // savedAt was added on the stored copy only.
    expect(getLocalReservations()[0].savedAt).toBeTruthy();
  });
});

describe("currentReservationsScopeKey", () => {
  it("derives a guest-scoped key from the active travelhub_guest_id when anonymous", () => {
    localStorage.setItem(GUEST_ID_KEY, "g-abc");
    expect(currentReservationsScopeKey()).toBe(
      `${LOCAL_RESERVATIONS_KEY}:guest:g-abc`,
    );
  });

  it("falls back to :guest:anon when there is no guest id yet", () => {
    expect(currentReservationsScopeKey()).toBe(
      `${LOCAL_RESERVATIONS_KEY}:guest:anon`,
    );
  });

  it("uses a user-scoped key (lowercased email) once authenticated", () => {
    persistSessionFromLogin({
      email: "  USER@Example.COM ",
      accessToken: "tok",
      userType: "traveler",
    });
    expect(currentReservationsScopeKey()).toBe(
      `${LOCAL_RESERVATIONS_KEY}:user:user@example.com`,
    );
  });
});

describe("scoping by identity", () => {
  it("isolates anonymous bookings from authenticated bookings", () => {
    // Anonymous booking
    localStorage.setItem(GUEST_ID_KEY, "g-1");
    appendLocalReservation({ id: "anon-trip" });
    expect(getLocalReservations()).toHaveLength(1);

    // Sign in as user A
    persistSessionFromLogin({
      email: "a@x.com",
      accessToken: "jwt-a",
      userType: "traveler",
    });
    // User A starts with no local bookings — guest data must NOT leak.
    expect(getLocalReservations()).toEqual([]);
    appendLocalReservation({ id: "trip-A1" });
    expect(getLocalReservations().map((r) => r.id)).toEqual(["trip-A1"]);
  });

  it("isolates two authenticated users on the same browser", () => {
    persistSessionFromLogin({
      email: "alice@x.com",
      accessToken: "jwt-a",
      userType: "traveler",
    });
    appendLocalReservation({ id: "alice-trip" });

    // Switch user — clearSessionUser wipes auth state, sign in as Bob.
    clearSessionUser();
    persistSessionFromLogin({
      email: "bob@x.com",
      accessToken: "jwt-b",
      userType: "traveler",
    });
    expect(getLocalReservations()).toEqual([]); // Bob sees nothing of Alice's
    appendLocalReservation({ id: "bob-trip" });
    expect(getLocalReservations().map((r) => r.id)).toEqual(["bob-trip"]);

    // Sign back in as Alice — her data is intact.
    clearSessionUser();
    persistSessionFromLogin({
      email: "alice@x.com",
      accessToken: "jwt-a",
      userType: "traveler",
    });
    expect(getLocalReservations().map((r) => r.id)).toEqual(["alice-trip"]);
  });

  it("logging out and back in as the same user does not duplicate or lose data", () => {
    persistSessionFromLogin({
      email: "u@x.com",
      accessToken: "tok",
      userType: "traveler",
    });
    appendLocalReservation({ id: "trip-1" });
    appendLocalReservation({ id: "trip-2" });

    clearSessionUser();
    persistSessionFromLogin({
      email: "u@x.com",
      accessToken: "tok",
      userType: "traveler",
    });

    expect(getLocalReservations().map((r) => r.id)).toEqual([
      "trip-2",
      "trip-1",
    ]);
  });

  it("treats the email comparison case-insensitively (User@X.com === user@x.com)", () => {
    persistSessionFromLogin({
      email: "User@X.com",
      accessToken: "t",
      userType: "traveler",
    });
    appendLocalReservation({ id: "trip-1" });

    clearSessionUser();
    persistSessionFromLogin({
      email: "user@x.com",
      accessToken: "t",
      userType: "traveler",
    });
    expect(getLocalReservations().map((r) => r.id)).toEqual(["trip-1"]);
  });
});

describe("legacy unscoped key migration", () => {
  it("moves data from the legacy global key into the current scope on first read", () => {
    localStorage.setItem(GUEST_ID_KEY, "g-1");
    localStorage.setItem(
      LOCAL_RESERVATIONS_KEY,
      JSON.stringify([{ id: "legacy-1" }]),
    );

    const list = getLocalReservations();

    expect(list.map((r) => r.id)).toEqual(["legacy-1"]);
    // Legacy key cleared; data now lives under the scoped key.
    expect(localStorage.getItem(LOCAL_RESERVATIONS_KEY)).toBeNull();
    expect(
      JSON.parse(localStorage.getItem(`${LOCAL_RESERVATIONS_KEY}:guest:g-1`)),
    ).toEqual([{ id: "legacy-1" }]);
  });

  it("does not overwrite existing scoped data when migrating", () => {
    localStorage.setItem(GUEST_ID_KEY, "g-1");
    localStorage.setItem(
      `${LOCAL_RESERVATIONS_KEY}:guest:g-1`,
      JSON.stringify([{ id: "scoped-keep" }]),
    );
    localStorage.setItem(
      LOCAL_RESERVATIONS_KEY,
      JSON.stringify([{ id: "legacy-discard" }]),
    );

    const list = getLocalReservations();

    expect(list.map((r) => r.id)).toEqual(["scoped-keep"]);
    // Legacy still wiped — we only honor the scoped data going forward.
    expect(localStorage.getItem(LOCAL_RESERVATIONS_KEY)).toBeNull();
  });
});
