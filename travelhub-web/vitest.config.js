import { defineConfig } from "vitest/config";
import { mergeConfig } from "vite";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: "./tests/setup.js",
      include: ["tests/**/*.{test,spec}.{js,jsx}"],
      css: true,
      passWithNoTests: false,
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "json-summary"],
        reportsDirectory: "./coverage",
        // Coverage focuses on the testable business-logic layer (API
        // client, auth state, booking helpers, constants). The React UI
        // (`src/pages`, `src/components`) is exercised by Playwright e2e,
        // not Vitest — same split that Kover applies on the Android app,
        // which scopes coverage to ViewModels/Repos/UseCases and skips
        // Compose screens. Adding new logic modules to coverage is a
        // one-line edit here.
        include: [
          "src/services/**/*.{js,jsx}",
          "src/auth/**/*.{js,jsx}",
          "src/bookings/**/*.{js,jsx}",
          "src/constants/**/*.{js,jsx}",
        ],
        exclude: [
          "src/**/*.{test,spec}.{js,jsx}",
          "src/main.jsx",
          "tests/**",
        ],
        // Mirrors the 80% gate enforced by Kover on travelhub-mobile,
        // which runs `minBound(80)` against LINE coverage only. We keep
        // the same primary metric (lines) and add statements/functions
        // since they're effectively free given the existing tests.
        // Branches is intentionally left ungated — mobile doesn't gate
        // it either and it tends to penalize defensive code (try/catch
        // wrappers, ?? fallbacks) that's been validated in other ways.
        // CI runs `npm run test:coverage` so the threshold actually
        // breaks the build when the covered modules dip below it.
        thresholds: {
          lines: 80,
          statements: 80,
          functions: 80,
        },
      },
    },
  }),
);
