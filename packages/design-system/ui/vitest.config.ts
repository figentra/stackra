/**
 * Stackra file contract:
 * Purpose: test config of @stackra/ui: the decorators vitest preset plus the shared coverage gate. `test` runs
 *          the unit tier (`<subject>.test.ts(x)` in `__tests__/`); the provider tests switch themselves to jsdom with
 *          a `@vitest-environment` comment. The infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under their
 *          own tasks, so they are excluded here.
 * Boundary: test configuration only; merges gen's `./.stackra/vitest.config` (the decorators preset, the coverage
 *           gate, the unit tier, the generated setup) under this package's own include and coverage, so gen keeps
 *           this file and writes no root shim (ADR 0295 decision 5; STA-1296, STA-1299).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { defineConfig, mergeConfig } from "vitest/config";

import generated from "./.stackra/vitest.config";

export default mergeConfig(
  generated,
  defineConfig(
    withCoverage({
      test: {
        // The first render of a real HeroUI component in jsdom is slow beside the other members' suites on a shared
        // runner, and then runs past the 5000 ms default; the same test takes well under a second alone.
        testTimeout: 30_000,
        include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
        exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],
      },
    }),
  ),
);
