/**
 * Stackra file contract:
 * Purpose: test config of @stackra/native-card-terminal: the decorators vitest preset plus the shared coverage gate.
 *          `test` runs the unit tier (`<subject>.test.ts` in `__tests__/`) of `src/` and `plugin/` in node; the native
 *          module is a stand-in object on `globalThis.expo.modules`, and the plugin's pure functions run without Expo.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement); ADR 0478 (decision 5).
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
