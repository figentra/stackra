/**
 * Stackra file contract:
 * Purpose: test config of @stackra/icons: the decorators vitest preset plus the shared coverage gate. `test` runs
 *          the unit tier (`<subject>.test.ts(x)` in `__tests__/`); the provider tests switch themselves to jsdom with
 *          a `@vitest-environment` comment. The infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under their
 *          own tasks, so they are excluded here.
 * Boundary: test configuration only; merges gen's `./.stackra/vitest.config` (the decorators preset, the coverage
 *           gate, the unit tier, the generated setup) under this package's own include and coverage, so gen keeps
 *           this file and writes no root shim (ADR 0295 decision 5; STA-1296, STA-1299). The five
 *          files `scripts/generate-icons.mjs` writes hold no logic (a list, re-exports and name-to-component maps)
 *          and are left out of coverage: the native ones cannot load outside React Native, so their tests read the
 *          committed text against the installed Lucide set instead, and a drift test guards all five.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { defineConfig, mergeConfig } from "vitest/config";

import generated from "./.stackra/vitest.config";

export default mergeConfig(
  generated,
  defineConfig(
    withCoverage(
      {
        test: {
          include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
          exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],
        },
      },
      {
        exclude: [
          "src/contracts/enums/lucide-icon-name.enum.ts",
          "src/*/lucide-icons/**",
          "src/*/lucide-registry/**",
        ],
      },
    ),
  ),
);
