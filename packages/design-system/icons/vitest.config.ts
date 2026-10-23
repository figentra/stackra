/**
 * Stackra file contract:
 * Purpose: test config of @stackra/icons: the decorators vitest preset plus the shared coverage gate. `test` runs
 *          the unit tier (`<subject>.test.ts(x)` in `__tests__/`); the provider tests switch themselves to jsdom with
 *          a `@vitest-environment` comment. The infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under their
 *          own tasks, so they are excluded here.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5). The five
 *          files `scripts/generate-icons.mjs` writes hold no logic (a list, re-exports and name-to-component maps)
 *          and are left out of coverage: the native ones cannot load outside React Native, so their tests read the
 *          committed text against the installed Lucide set instead, and a drift test guards all five.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitestDecorators,
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
