/**
 * Stackra file contract:
 * Purpose: test config of @figentra/playground — the React (jsdom) vitest preset. `test` runs the unit tier; the
 *          infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under their own tasks (TS1/TS2).
 * Boundary: test configuration only.
 * Runtime: node
 * Governing contract: ADR 0182 (testing strategy); ADR 0300 (published tooling presets).
 * Owner: the app owner · Secrets: forbidden
 */
import { stackraVitestReact } from "@stackra/vitest-config/preset-react";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitestReact,
  defineConfig({
    test: {
      // A page test mounts a whole page of real HeroUI components in jsdom; beside the other members' suites on a shared
      // runner it needs more than the 5000 ms default (about 300 ms alone).
      testTimeout: 30_000,
      include: ["src/**/__tests__/**/*.test.{ts,tsx}", "scripts/**/__tests__/**/*.test.ts"],
      exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],
    },
  }),
);
