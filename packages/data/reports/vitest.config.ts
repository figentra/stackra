/**
 * Stackra file contract:
 * Purpose: test config of @stackra/reports: the vitest preset plus the shared coverage gate. `test` runs the unit
 *          tier (`<subject>.test.ts` in `__tests__/`); the infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run
 *          under their own tasks, so they are excluded here.
 * Boundary: test configuration only; merges gen's `./.stackra/vitest.config` (the preset, the coverage gate, the
 *           generated setup) under this package's own include, so gen keeps this file and writes no root shim
 *           (ADR 0295 decision 5; STA-1296).
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
        include: ["src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
      },
    }),
  ),
);
