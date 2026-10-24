/**
 * Stackra file contract:
 * Purpose: test config of @stackra/entitlements: the shared vitest preset plus the shared coverage gate. `test` runs
 *          the unit tier (`<subject>.test.ts` in `__tests__/`); the infixed tiers (`.int`, `.contract`, `.e2e`,
 *          `.load`) run under their own tasks.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { stackraVitest } from "@stackra/vitest-config/preset";
import { defineConfig, mergeConfig } from "vitest/config";

// shortcut: authored until gen writes the tool configs into `.stackra/`; delete it with STA-339.
export default mergeConfig(
  stackraVitest,
  defineConfig(
    withCoverage({
      test: {
        include: ["src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
      },
    }),
  ),
);
