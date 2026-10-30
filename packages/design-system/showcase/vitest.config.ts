/**
 * Stackra file contract:
 * Purpose: test config of @stackra/showcase: the shared vitest preset plus the coverage gate. `test` runs the unit
 *          tier (`<subject>.test.ts` in `__tests__/`); `check` runs the registry gate alone. The registry entry
 *          files and the generated barrel are data, so they are left out of coverage.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { stackraVitest } from "@stackra/vitest-config/preset";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig(
    withCoverage(
      {
        test: {
          include: ["src/**/__tests__/**/*.test.ts", "scripts/**/__tests__/**/*.test.ts"],
          exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
        },
      },
      { exclude: ["src/registry/components/**", "src/registry/components.generated.ts"] },
    ),
  ),
);
