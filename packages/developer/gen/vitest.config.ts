/**
 * Stackra file contract:
 * Purpose: test config of @stackra/gen: the decorators vitest preset (for @stackra/validation's legacy decorators) plus
 *          the shared coverage gate. `test` runs the unit tier (`<subject>.test.ts` in `__tests__/`); the infixed tiers
 *          (`.int`, `.contract`, `.e2e`, `.load`) run under their own tasks, so they are excluded here.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitestDecorators,
  defineConfig(
    withCoverage({
      test: {
        include: ["src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
        // The host tests open a real TypeScript program; tsgo starts its native binary on first use.
        testTimeout: 30_000,
      },
    }),
  ),
);
