import { test, expect } from "@playwright/test";

import { PATH_TRAVELERS_HOME } from "../src/constants/routes.js";
import { installRegisterLoginDashboardMocks } from "./auth-mocks.js";

function goSignup(page) {
  return page.goto("/signup");
}

test.describe("Registro — validación de inputs (sin API)", () => {
  test("formulario vacío: nombre y apellidos son obligatorios", async ({ page }) => {
    await goSignup(page);
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(page.getByText("Nombre y apellidos son obligatorios.")).toBeVisible();
  });

  test("falta apellido: nombre y apellidos son obligatorios", async ({ page }) => {
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Solo");
    await page.getByLabel("Correo electrónico").fill("a@b.co");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("12345678");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("12345678");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(page.getByText("Nombre y apellidos son obligatorios.")).toBeVisible();
  });

  test("correo con formato inválido", async ({ page }) => {
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Ana");
    await page.getByLabel("Apellidos", { exact: true }).fill("García");
    await page.getByLabel("Correo electrónico").fill("sin-arroba");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("12345678");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("12345678");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("correo sin dominio con punto: inválido", async ({ page }) => {
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Ana");
    await page.getByLabel("Apellidos", { exact: true }).fill("García");
    await page.getByLabel("Correo electrónico").fill("user@nopunto");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("12345678");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("12345678");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  });

  test("contraseña con menos de 8 caracteres", async ({ page }) => {
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Ana");
    await page.getByLabel("Apellidos", { exact: true }).fill("García");
    await page.getByLabel("Correo electrónico").fill("ana@ex.co");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("1234567");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("1234567");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(
      page.getByText("La contraseña debe tener al menos 8 caracteres."),
    ).toBeVisible();
  });

  test("las contraseñas no coinciden", async ({ page }) => {
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Ana");
    await page.getByLabel("Apellidos", { exact: true }).fill("García");
    await page.getByLabel("Correo electrónico").fill("ana@ex.co");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("12345678");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("87654321");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
  });

  test("orden: si falta apellido no llega a validar el correo", async ({ page }) => {
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Solo");
    await page.getByLabel("Correo electrónico").fill("malo");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("12345678");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("12345678");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(page.getByText("Nombre y apellidos son obligatorios.")).toBeVisible();
  });
});

test.describe("Registro — flujo mockeado (API simulada)", () => {
  test("201 + login: redirige a /travelers y muestra el hero", async ({ page }) => {
    await installRegisterLoginDashboardMocks(page, {
      registerJson: {
        id: "id-1",
        email: "nueva@example.com",
        first_name: "Luis",
        last_name: "Pérez",
        user_type: "traveler",
      },
      loginJson: {
        access_token: "tok-reg-1",
        user_type: "traveler",
      },
    });
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Luis");
    await page.getByLabel("Apellidos", { exact: true }).fill("Pérez");
    await page.getByLabel("Correo electrónico").fill("nueva@example.com");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("87654321");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("87654321");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await page.waitForURL(`**${PATH_TRAVELERS_HOME}`, { timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: "Encuentra tu estadía perfecta" }),
    ).toBeVisible();
  });

  test("409: correo ya registrado", async ({ page }) => {
    await installRegisterLoginDashboardMocks(page, {
      registerStatus: 409,
      registerErrorBody: {},
    });
    await goSignup(page);
    await page.getByLabel("Nombre", { exact: true }).fill("Ana");
    await page.getByLabel("Apellidos", { exact: true }).fill("García");
    await page.getByLabel("Correo electrónico").fill("ya@ex.co");
    await page.getByLabel("Crea una contraseña", { exact: true }).fill("12345678");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("12345678");
    await page.getByRole("button", { name: /Comenzar/ }).click();
    await expect(
      page.getByText("Este correo ya está registrado. Puedes iniciar sesión."),
    ).toBeVisible();
  });
});
