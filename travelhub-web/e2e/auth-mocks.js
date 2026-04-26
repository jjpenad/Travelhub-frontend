/**
 * Mocks de red para E2E (VITE_API_URL = https://e2e-api.local en playwright.config).
 */

export const DASHBOARD_EMPTY = {
  total_reservas: 0,
  total_personas: 0,
  total_ganancias: 0,
  reservations: [],
  revenue_per_day: [],
  percent_status: {},
};

export async function installLoginAndDashboardMocks(page, { loginJson, loginStatus = 200 }) {
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();

    if (url.includes("/auth/login") && req.method() === "POST") {
      const body =
        loginStatus >= 400
          ? JSON.stringify(
              loginJson && Object.keys(loginJson).length > 0 ? loginJson : {},
            )
          : JSON.stringify(loginJson);
      await route.fulfill({
        status: loginStatus,
        contentType: "application/json",
        body,
      });
      return;
    }

    if (url.includes("analitycs/dahsboard") && req.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DASHBOARD_EMPTY),
      });
      return;
    }

    await route.continue();
  });
}

/**
 * POST /auth/register + /auth/login + panel analítica (mismo patrón que el flujo real tras registro).
 */
export async function installRegisterLoginDashboardMocks(page, options = {}) {
  const {
    registerStatus = 201,
    registerJson = {
      id: "e2e-user-1",
      email: "nueva@example.com",
      first_name: "Ana",
      last_name: "García",
      user_type: "traveler",
    },
    registerErrorBody = null,
    loginJson = {
      access_token: "e2e-reg-token",
      token_type: "bearer",
      user_type: "traveler",
    },
  } = options;

  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();

    if (url.includes("/auth/register") && req.method() === "POST") {
      const errBody =
        registerStatus >= 400
          ? JSON.stringify(
              registerErrorBody && Object.keys(registerErrorBody).length > 0
                ? registerErrorBody
                : {},
            )
          : JSON.stringify(registerJson);
      await route.fulfill({
        status: registerStatus,
        contentType: "application/json",
        body: errBody,
      });
      return;
    }

    if (url.includes("/auth/login") && req.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(loginJson),
      });
      return;
    }

    if (url.includes("analitycs/dahsboard") && req.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DASHBOARD_EMPTY),
      });
      return;
    }

    await route.continue();
  });
}
