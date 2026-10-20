/**
 * Stackra file contract:
 * Purpose: test config of @figentra/{{NAME}} — the base vitest preset; `test` runs the unit tier and skips the
 *          infixed tiers (`.int`, `.contract`, `.e2e`, `.load`, TS1/TS2).
 * Owner: the app owner · Secrets: forbidden
 */
import { stackraVitest } from "@stackra/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig({
    test: {
      include: ["src/**/__tests__/**/*.test.ts"],
      exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
    },
  }),
);
