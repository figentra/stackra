/**
 * Stackra file contract:
 * Purpose: test config of @stackra/config: the decorators vitest preset (the tests apply `@Secret`; the `./react` tests
 *          render with react-dom/server) plus the shared coverage gate. `test` runs the unit tier
 *          (`<subject>.test.ts(x)` in `__tests__/`); the infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under
 *          their own tasks.
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
        include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
        exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],
      },
    }),
  ),
);
