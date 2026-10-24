/**
 * Stackra file contract:
 * Purpose: test config of @stackra/testing: the base vitest preset plus the shared coverage gate. `test` runs the
 *          unit tier (`<subject>.test.ts` in `__tests__/`); the infixed tiers (`.int`, `.contract`, `.e2e`, `.load`)
 *          run under their own tasks, so they are excluded here.
 * Boundary: test configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement); ADR 0269 (decision 4).
 */
import { fileURLToPath } from "node:url";
import { withCoverage } from "@stackra/vitest-config/coverage";
import { stackraVitest } from "@stackra/vitest-config/preset";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitest,
  defineConfig(
    withCoverage({
      // shortcut: the package's own tests import it by name, because the hoisting gate of ADR 0269 decision 4 must
      // see the `@stackra/testing` specifier; this alias resolves that self-reference until gen writes tool configs
      // (STA-339).
      resolve: {
        alias: [
          {
            find: /^@stackra\/testing$/,
            replacement: fileURLToPath(new URL("src/core/index.ts", import.meta.url)),
          },
        ],
      },
      test: {
        include: ["src/**/__tests__/**/*.test.ts"],
        exclude: ["**/*.{int,contract,e2e,load}.test.ts"],
      },
    }),
  ),
);
