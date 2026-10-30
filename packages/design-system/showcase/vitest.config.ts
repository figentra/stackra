/**
 * Stackra file contract:
 * Purpose: test config of @stackra/showcase: the shared vitest preset plus the coverage gate. `test` runs the unit
 *          tier (`<subject>.test.ts` in `__tests__/`); `check` runs the registry gate alone. The registry entry
 *          files and the generated barrel are data, so they are left out of coverage.
 * Boundary: test configuration only; merges gen's `./.stackra/vitest.config` under this package's own include and
 *           coverage, so gen keeps this file and writes no root shim (ADR 0295 decision 5).
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
          include: ["src/**/__tests__/**/*.test.ts", "scripts/**/__tests__/**/*.test.ts"],
          exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
        },
      },
      { exclude: ["src/registry/components/**", "src/registry/components.generated.ts"] },
    ),
  ),
);
