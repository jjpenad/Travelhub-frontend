/**
 * Mocks de red para el flujo viajero: búsqueda → detalle → reserva → checkout →
 * pago (comprobante) → confirmación.
 * Usar con `VITE_API_URL` apuntando al host ficticio de Playwright (`https://e2e-api.local`).
 */

const DEMO_HOTEL = {
  hotel_id: "demo-hotel-gif",
  hotel_name: "Hotel Demo — Flujo reserva",
  city: "Lima",
  rating: "4.8",
  stars: 4,
  description: "Propiedad de demostración para documentación del flujo de reserva.",
  address: "Av. Ejemplo 123",
  available_room_types: [
    {
      id: "rt-demo-suite",
      name: "Suite Vista",
      description: "Amplia, cama king, escritorio.",
      max_capacity: 2,
      bed_type: "King",
      size_sqm: "38",
      price_per_night: "125",
      total_price: "500",
      currency_code: "USD",
      minimum_stay: 1,
      amenities: ["wifi", "tv"],
    },
  ],
};

const SEARCH_PAYLOAD = { result: [DEMO_HOTEL] };

const BOOKING_CREATE_OK = {
  result: {
    proceed: true,
    reservation_id: "gif-demo-res-1",
    pricing: {
      nights: 4,
      guests: 2,
      price_per_night: 125,
      total: 500,
      currency_code: "COP",
      taxes: "0",
    },
    check_in: "2026-06-01",
    check_out: "2026-06-05",
    room_type: { id: "rt-demo-suite", name: "Suite Vista" },
    hotel: {
      id: "demo-hotel-gif",
      name: "Hotel Demo — Flujo reserva",
      city: "Lima",
    },
  },
};

/**
 * @param {import('@playwright/test').Route} route
 * @param {string} url
 * @param {string} method
 * @returns {Promise<boolean>} true si se respondió
 */
async function maybeFulfill(route, url, method) {
  if (url.includes("/accommodations/search") && method === "GET") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SEARCH_PAYLOAD),
    });
    return true;
  }

  if (url.includes("/accommodations/hotels/") && url.includes("/availability") && method === "GET") {
    const nights = 4;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hotel_id: DEMO_HOTEL.hotel_id,
        hotel_name: DEMO_HOTEL.hotel_name,
        city: DEMO_HOTEL.city,
        rating: DEMO_HOTEL.rating,
        stars: DEMO_HOTEL.stars,
        description: DEMO_HOTEL.description,
        address: DEMO_HOTEL.address,
        nights,
        check_in_time: "15:00",
        check_out_time: "11:00",
        available_room_types: DEMO_HOTEL.available_room_types,
      }),
    });
    return true;
  }

  if (url.includes("/currency/v1/rates") && method === "GET") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rate: 4000, base_currency: "USD", quote_currency: "COP" }),
    });
    return true;
  }

  if (url.includes("api.frankfurter.dev") && url.includes("/v2/rate/") && method === "GET") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rate: 4000 }),
    });
    return true;
  }

  if (url.includes("/reservation-flow/create") && method === "POST") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(BOOKING_CREATE_OK),
    });
    return true;
  }

  if (url.includes("/reservation-flow/payment") && method === "POST") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          success: true,
          reservation_id: "gif-demo-res-1",
          confirmation_code: "GIF-CONFIRM-01",
        },
      }),
    });
    return true;
  }

  return tryFulfillPaymentAndAuth(route, url, method);
}

/**
 * Pago, conversión FX y registro opcional en checkout.
 * @param {import('@playwright/test').Route} route
 * @param {string} url
 * @param {string} method
 * @returns {Promise<boolean>}
 */
async function tryFulfillPaymentAndAuth(route, url, method) {
  if (url.includes("/currency/v1/convert") && method === "POST") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        converted_amount: 2000000,
        quote_amount: 2000000,
        amount_out: 2000000,
        to_currency: "COP",
        currency: "COP",
      }),
    });
    return true;
  }

  if (url.includes("/auth/register") && method === "POST") {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "e2e-gif-guest",
        email: "ana.demo@example.com",
        user_type: "traveler",
      }),
    });
    return true;
  }

  return false;
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function installBookingFlowMocks(page) {
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();

    if (!url.includes("e2e-api.local")) {
      await route.continue();
      return;
    }

    const done = await maybeFulfill(route, url, req.method());
    if (done) return;

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ detail: `e2e: no mock for ${url}` }),
    });
  });
}
