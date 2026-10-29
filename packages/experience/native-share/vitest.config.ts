/**
 * Stackra file contract:
 * Purpose: test config of @stackra/native-share: the decorators vitest preset (for @stackra/validation's legacy
 *          decorators) plus the shared coverage gate. `test` runs the unit tier (`<subject>.test.ts(x)` in
 *          `__tests__/`) of `src/` and of the config plugin in `plugin/src/`, in node, with expo-sharing and React
 *          Native mocked.
 * Boundary: test configuration only; merges gen's `./.stackra/vitest.config` (the decorators preset, the
 *           coverage gate, the generated setup) under this package's own include, so gen keeps this file and writes no
 *           root shim (ADR 0295 decision 5; STA-1296).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { defineConfig, mergeConfig } from "vitest/config";

import generated from "./.stackra/vitest.config";

export default mergeConfig(
  generated,
  defineConfig(
    withCoverage({
      test: {
        include: ["src/**/__tests__/**/*.test.{ts,tsx}", "plugin/src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
      },
    }),
  ),
);
