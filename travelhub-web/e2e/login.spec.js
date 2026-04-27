import { test, expect } from "@playwright/test";

import { PATH_HOTEL_PORTAL_HOME, PATH_TRAVELERS_HOME } from "../src/constants/routes.js";
import { DASHBOARD_EMPTY, installLoginAndDashboardMocks } from "./auth-mocks.js";

function passwordField(page) {
  return page.getByRole("textbox", { name: "Contraseña" });
}

test.describe("Login — validación en cliente (sin API)", () => {
  test("correo vacío: pide un correo válido", async ({ page }) => {
    await page.goto("/login");
    await passwordField(page).fill("cualquier");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("correo solo con espacios: pide un correo válido", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("   ");
    await passwordField(page).fill("cualquier");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("correo sin @: pide un correo válido", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("nadaquever");
    await passwordField(page).fill("cualquier");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("correo sin dominio con punto (user@x): pide un correo válido", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("user@nohaypunto");
    await passwordField(page).fill("cualquier");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("muestra error si el correo no es válido (texto claro inválido)", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("no-es-correo");
    await passwordField(page).fill("secret123");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("falta la contraseña: no llama a éxito y muestra mensaje", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("user@example.com");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce tu contraseña.")).toBeVisible();
  });

  test("correo y contraseña vacíos: prioridad al correo inválido", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("correo no válido y contraseña vacía: se muestra error de correo (no de contraseña)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("not-email");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
    await expect(page.getByText("Introduce tu contraseña.")).toHaveCount(0);
  });

  test("contraseña solo espacios: el cliente no la considera vacía; API puede responder 401", async ({
    page,
  }) => {
    await installLoginAndDashboardMocks(page, { loginJson: {}, loginStatus: 401 });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("ok@ex.co");
    await passwordField(page).fill("    ");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });

  test("correo con + y subdominio: aceptado y se puede iniciar sesión (mock)", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {
        access_token: "e2e-token",
        user_type: "traveler",
      },
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("nombre+etiqueta@sub.mail.com");
    await passwordField(page).fill("x");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await page.waitForURL(`**${PATH_TRAVELERS_HOME}`);
  });
});

test.describe("Login — flujo mockeado (API simulada)", () => {
  test("user_type hotel: portal + heading Dashboard", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {
        access_token: "e2e-token-hotel",
        token_type: "bearer",
        user_type: "hotel",
      },
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("hotel@example.com");
    await passwordField(page).fill("password123");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await page.waitForURL(`**${PATH_HOTEL_PORTAL_HOME}`);
    await expect(page).toHaveURL(new RegExp(`${PATH_HOTEL_PORTAL_HOME.replace(/\//g, "\\/")}$`));
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("user_type traveler: home pública + hero", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {
        access_token: "e2e-token-traveler",
        token_type: "bearer",
        user_type: "traveler",
      },
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("viajero@example.com");
    await passwordField(page).fill("password123");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await page.waitForURL(`**${PATH_TRAVELERS_HOME}`);
    await expect(page).toHaveURL(new RegExp(`${PATH_TRAVELERS_HOME.replace(/\//g, "\\/")}$`));
    await expect(
      page.getByRole("heading", { name: "Encuentra tu estadía perfecta" }),
    ).toBeVisible();
  });

  test("401: credenciales incorrectas", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {},
      loginStatus: 401,
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("bad@example.com");
    await passwordField(page).fill("wrong");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });

  test("422: mensaje de datos inválidos", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {},
      loginStatus: 422,
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("a@b.co");
    await passwordField(page).fill("x");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Revisa los datos e inténtalo de nuevo.")).toBeVisible();
  });

  test("401 con detail del servidor: muestra ese mensaje", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: { detail: "Demasiados intentos. Prueba más tarde." },
      loginStatus: 401,
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("a@b.co");
    await passwordField(page).fill("x");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(
      page.getByText("Demasiados intentos. Prueba más tarde."),
    ).toBeVisible();
  });

  test("403 con cuerpo vacío: credenciales incorrectas", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {},
      loginStatus: 403,
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("a@b.co");
    await passwordField(page).fill("x");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });

  test("500: error genérico", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {},
      loginStatus: 500,
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("a@b.co");
    await passwordField(page).fill("x");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await expect(page.getByText("No se pudo iniciar sesión.")).toBeVisible();
  });

  test("user_type admin_hotel: trata como hotel (Dashboard)", async ({ page }) => {
    await installLoginAndDashboardMocks(page, {
      loginJson: {
        access_token: "e2e-adm",
        user_type: "admin_hotel",
      },
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("ops@example.com");
    await passwordField(page).fill("p");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await page.waitForURL(`**${PATH_HOTEL_PORTAL_HOME}`);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("el POST de login envía el correo en minúsculas", async ({ page }) => {
    let body = null;
    await page.route("**/*", async (route) => {
      const r = route.request();
      if (r.url().includes("/auth/login") && r.method() === "POST") {
        body = r.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "tok",
            user_type: "traveler",
          }),
        });
        return;
      }
      if (r.url().includes("analitycs/dahsboard") && r.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DASHBOARD_EMPTY),
        });
        return;
      }
      await route.continue();
    });
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("  MixEd@ExAmPlE.ORG  ");
    await passwordField(page).fill("s");
    await page.getByRole("button", { name: /Iniciar sesión/ }).click();
    await page.waitForURL(`**${PATH_TRAVELERS_HOME}`);
    expect(body?.email).toBe("mixed@example.org");
  });

  test("mostrar u ocultar contraseña alterna el tipo del input", async ({ page }) => {
    await page.goto("/login");
    const input = page.locator("#login-password");
    await input.fill("secreto");
    await expect(input).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(input).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña" }).click();
    await expect(input).toHaveAttribute("type", "password");
  });
});
