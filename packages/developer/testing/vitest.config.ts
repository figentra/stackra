/**
 * Stackra file contract:
 * Purpose: test config of @stackra/testing: gen's `./.stackra/vitest.config` (the decorators preset, the coverage
 *          gate, the unit tier and the generated setup) plus this package's own include, the shared coverage gate
 *          and the self-reference alias. `test` runs the unit tier (`<subject>.test.ts` in `__tests__/`); the
 *          `./react` tests switch themselves to jsdom with a `@vitest-environment` comment, as @stackra/ui's do, and
 *          the rest stay on node. The infixed tiers (`.int`, `.contract`, `.e2e`, `.load`) run under their own tasks.
 * Boundary: test configuration only; merges gen's config, so gen keeps this file and writes no root shim (ADR 0295
 *           decision 5; STA-1296, STA-1299). This member is off `@stackra/container` (rule 6c), so its generated
 *           setup imports no `@stackra/container/testing` (`usesContainer`, STA-1365) and merging adds no cycle. The
 *           generated file is loaded at run time behind `existsSync`, as the tsdown configs do (stackra-239): before
 *           gen has run, the base preset stands in.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage); ADR 0022 (test placement); ADR 0269 (decision 4).
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { withCoverage } from "@stackra/vitest-config/coverage";
import { stackraVitest } from "@stackra/vitest-config/preset";
import { defineConfig, mergeConfig } from "vitest/config";

// A runtime URL, so the config loader never tries to resolve the file before `stackra gen` has written it.
const url = new URL("./.stackra/vitest.config.ts", import.meta.url);
const generated = existsSync(url) ? (await import(url.href)).default : stackraVitest;

export default mergeConfig(
  generated,
  defineConfig(
    withCoverage({
      // The package's own tests import it by name, because the hoisting gate of ADR 0269 decision 4 must see the
      // `@stackra/testing` specifier; this alias resolves that self-reference.
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
