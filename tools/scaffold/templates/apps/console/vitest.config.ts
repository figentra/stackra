/**
 * Stackra file contract:
 * Purpose: test config of @figentra/{{NAME}} — the React (jsdom) vitest preset. `test` runs the unit tier; the
 *          infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under their own tasks (TS1/TS2).
 * Boundary: test configuration only.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0182 (testing strategy); ADR 0300 (published tooling presets).
 * Owner: the app owner · Secrets: forbidden
 */
import { stackraVitestReact } from "@stackra/vitest-config/preset-react";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitestReact,
  defineConfig({
    test: {
      include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
      exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],
    },
  }),
);
