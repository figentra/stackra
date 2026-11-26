/**
 * Stackra file contract:
 * Purpose: `emitLoadTierConfig`, the Vitest config of the load tier gen writes into `.stackra/` for a member that has a
 *          `.load.test.ts`: the generated unit config narrowed by `loadTier` from `@stackra/vitest-config/load`, so
 *          `stackra test --tier load` keeps the preset, the aliases and the generated setup and runs only the
 *          `.load.test.ts` files (each serves its subject and drives it with k6). Nobody authors a
 *          `vitest.load.config.ts`.
 * Boundary: pure. The caller decides whether the member has a load test (it reads the disk) and writes this file beside
 *           `.stackra/vitest.config.ts`; the file imports that config, so it is only valid when that one is written.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: gen writes every tool file into `.stackra/`); ADR 0182 (decisions 1 and
 *                     4: the load tier, weekly k6 load tests); STA-317.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";

/**
 * The load-tier config of `packageName`.
 *
 * @param packageName - the member's package name, for the header.
 * @example
 * emitLoadTierConfig("@stackra/queue").path; // ".stackra/vitest.load.config.ts"
 */
export function emitLoadTierConfig(packageName: string): GeneratedFile {
  return {
    path: ".stackra/vitest.load.config.ts",
    content: [
      generatedHeader({
        from: ".stackra/vitest.config.ts and the `.load.test.ts` files under src/",
        purpose: `the load tests of ${packageName}: the unit config narrowed to the \`.load\` tier.`,
        boundary:
          "`<subject>.load.test.ts(x)` in `__tests__/`, one file and one test after another; run by `stackra test --tier load`.",
        runtime: "node",
      }),
      'import { loadTier } from "@stackra/vitest-config/load";',
      "",
      'import config from "./vitest.config";',
      "",
      "export default loadTier(config);",
      "",
    ].join("\n"),
  };
}
