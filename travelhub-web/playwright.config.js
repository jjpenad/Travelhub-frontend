/* eslint-disable no-undef */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 4173);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * E2E: Vite con `VITE_API_URL` ficticio; los specs usan `page.route` vía `e2e/auth-mocks.js`.
 * Puerto por defecto 4173; para alinear con p. ej. 5174: `E2E_PORT=5174 npm run test:e2e`
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_API_URL: "https://e2e-api.local",
      VITE_ANALYTICS_API_URL: "https://e2e-api.local",
    },
  },
});
