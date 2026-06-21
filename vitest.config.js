// Pocket — Vitest config, intentionally separate from vite.config.js so the
// production build never imports vitest. The engine tests are pure JS (no DOM),
// so the default node environment is all we need.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
