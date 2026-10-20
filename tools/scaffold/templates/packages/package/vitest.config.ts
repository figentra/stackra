/**
 * Stackra file contract:
 * Purpose: test config of @stackra/{{NAME}} — the shared vitest preset plus the shared coverage gate. `test` runs
 *          the unit tier (`<subject>.test.ts` in `__tests__/`); the infixed tiers (`.int`, `.contract`, `.e2e`,
 *          `.load`) run under their own tasks (TS1/TS2), so they are excluded here.
 * Owner: the package owner · Secrets: forbidden
 */
import { stackraVitest } from "@stackra/vitest-config";
import { withCoverage } from "@stackra/vitest-config/coverage";
import { defineConfig, mergeConfig } from "vitest/config";

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
