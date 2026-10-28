/**
 * Stackra file contract:
 * Purpose: test config of @stackra/native-receipt-printer: the decorators vitest preset (for @stackra/validation's
 *          legacy decorators, reached through `PeripheralsConfig`) plus the shared coverage gate. `test` runs the unit
 *          tier of the drivers (against a stand-in Expo module) and of the config plugin's helpers, in node.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5). The Swift and
 *           Kotlin are checked on the box and on certified models (STA-739), not here.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement); ADR 0478.
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
        include: ["src/**/__tests__/**/*.test.ts", "plugin/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
      },
    }),
  ),
);
