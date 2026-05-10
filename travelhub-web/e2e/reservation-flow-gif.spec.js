/**
 * Genera frames PNG por idioma para los GIFs de documentación (es / en).
 *
 * Flujo: búsqueda → detalle → checkout → comprobante → confirmación.
 *
 * Uso:
 *   RECORD_GIF=1 npm run docs:gif
 *
 * Requiere ffmpeg (véase scripts/png-sequence-to-gif.mjs).
 */

/* eslint-disable no-undef */
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { installBookingFlowMocks } from "./booking-flow-mocks.js";

const GIF_LOCALES = /** @type {const} */ (["es", "en"]);

const FRAMES_BASE = join(process.cwd(), "docs", "assets", "gif-frames");

test.describe.configure({ mode: "serial" });

for (const locale of GIF_LOCALES) {
  test(`captura frames flujo reserva (${locale})`, async ({ page }) => {
    test.setTimeout(90_000);

    test.skip(
      !process.env.RECORD_GIF,
      "Definir RECORD_GIF=1 para generar frames del GIF",
    );

    const framesDir = join(FRAMES_BASE, locale);
    if (!existsSync(framesDir)) {
      mkdirSync(framesDir, { recursive: true });
    }

    await page.addInitScript(
      ({ key, lang }) => {
        localStorage.setItem(key, lang);
      },
      { key: "travelhub-lang", lang: locale },
    );

    await installBookingFlowMocks(page);
    await page.setViewportSize({ width: 1366, height: 800 });

    const q =
      "destination=Lima&checkIn=2026-06-01&checkOut=2026-06-05&guests=2";
    await page.goto(`/search?${q}`, { waitUntil: "domcontentloaded" });

    await expect(page.locator(".hotel-card").first()).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({
      path: join(framesDir, "01-results.png"),
      fullPage: false,
    });

    await page.locator(".hotel-card__book").first().click();
    await expect(page.locator(".booking-widget__reserve")).toBeVisible({
      timeout: 20_000,
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: join(framesDir, "02-detail.png"),
      fullPage: false,
    });

    await page.locator(".booking-widget__reserve").click();
    await page.waitForURL(/\/checkout\//, { timeout: 15_000 });
    await expect(page.locator("#guest-form-first-name")).toBeVisible({
      timeout: 15_000,
    });

    await page.fill("#guest-form-first-name", "Ana");
    await page.fill("#guest-form-last-name", "Demo");
    await page.fill("#guest-form-email", "ana.demo@example.com");
    await page.fill("#guest-form-phone", "+57 300 0000000");

    await page.getByText("PayPal", { exact: false }).first().click();

    const payBtn = page.locator(".booking-summary-card__confirm");
    await payBtn.scrollIntoViewIfNeeded();
    await expect(payBtn).toBeEnabled({ timeout: 20_000 });

    await page.waitForTimeout(400);
    await page.screenshot({
      path: join(framesDir, "03-checkout.png"),
      fullPage: false,
    });

    await payBtn.click();
    await page.waitForURL(/\/payment-voucher/, { timeout: 20_000 });
    await expect(page.locator(".payment-voucher__finish")).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: join(framesDir, "04-voucher.png"),
      fullPage: false,
    });

    await page.locator(".payment-voucher__finish").scrollIntoViewIfNeeded();
    await page.locator(".payment-voucher__finish").click();
    await page.waitForURL(/\/confirmation/, { timeout: 15_000 });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: join(framesDir, "05-confirmation.png"),
      fullPage: false,
    });
  });
}
