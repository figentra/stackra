/**
 * Stackra file contract:
 * Purpose: test config of @stackra/native-receipt-printer: the decorators vitest preset (for @stackra/validation's
 *          legacy decorators, reached through `PeripheralsConfig`) plus the shared coverage gate. `test` runs the unit
 *          tier of the drivers (against a stand-in Expo module) and of the config plugin's helpers, in node.
 * Boundary: test configuration only; merges gen's `./.stackra/vitest.config` (the decorators preset, the
 *           coverage gate, the generated setup) under this package's own include, so gen keeps this file and writes no
 *           root shim (ADR 0295 decision 5; STA-1296). The Swift and
 *           Kotlin are checked on the box and on certified models (STA-739), not here.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement); ADR 0478.
 */
import { withCoverage } from "@stackra/vitest-config/coverage";
import { defineConfig, mergeConfig } from "vitest/config";

import generated from "./.stackra/vitest.config";

export default mergeConfig(
  generated,
  defineConfig(
    withCoverage({
      test: {
        include: ["src/**/__tests__/**/*.test.ts", "plugin/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
      },
    }),
  ),
);
