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
        include: ["src/**/*.{js,jsx}"],
        exclude: [
          "src/**/*.{test,spec}.{js,jsx}",
          "src/main.jsx",
          "tests/**",
        ],
      },
    },
  }),
);
