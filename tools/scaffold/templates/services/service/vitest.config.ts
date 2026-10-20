/**
 * Stackra file contract:
 * Purpose: test config of @figentra/service-{{NAME}} — the decorators vitest preset. `test` runs the unit tier
 *          (`<subject>.test.ts` in `__tests__/`); the infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under
 *          their own tasks (TS1/TS2), so they are excluded here.
 * Owner: the service owner · Secrets: forbidden
 */
import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitestDecorators,
  defineConfig({
    test: {
      include: ["src/**/__tests__/**/*.test.ts"],
      exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
    },
  }),
);
