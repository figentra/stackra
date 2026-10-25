/**
 * Stackra file contract:
 * Purpose: test config of @stackra/theming: the decorators vitest preset (for @stackra/validation's legacy
 *          decorators) plus the shared coverage gate. The hook test opts into jsdom per file; the browser driver test
 *          stubs `matchMedia`; react-native is mocked in the native driver test. `test` runs the unit tier
 *          (`<subject>.test.ts(x)` in `__tests__/`); the infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run
 *          under their own tasks.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";
import { defineConfig, mergeConfig } from "vitest/config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default mergeConfig(
  stackraVitestDecorators,
  defineConfig(
    withCoverage({
      test: {
        include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
        exclude: ["**/*.{int,contract,e2e,load}.test.{ts,tsx}"],
      },
    }),
  ),
);
