/**
 * Stackra file contract:
 * Purpose: `emitIntTierConfig`, the Vitest config of the integration tier gen writes into `.stackra/` for a member that
 *          has an `.int.test.ts`: the generated unit config narrowed by `intTier` from `@stackra/vitest-config/int`, so
 *          `stackra test --tier int` keeps the preset, the aliases and the generated setup and runs only the
 *          `.int.test.ts` files. Nobody authors a `vitest.int.config.ts`.
 * Boundary: pure. The caller decides whether the member has an int test (it reads the disk) and writes this file beside
 *           `.stackra/vitest.config.ts`; the file imports that config, so it is only valid when that one is written.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: gen writes every tool file into `.stackra/`); ADR 0182 (decision 1: test
 *                     tiers); STA-1570 (`intTier`); STA-1819.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";

/**
 * The integration-tier config of `packageName`.
 *
 * @param packageName - the member's package name, for the header.
 * @example
 * emitIntTierConfig("@figentra/service-demo").path; // ".stackra/vitest.int.config.ts"
 */
export function emitIntTierConfig(packageName: string): GeneratedFile {
  return {
    path: ".stackra/vitest.int.config.ts",
    content: [
      generatedHeader({
        from: ".stackra/vitest.config.ts and the `.int.test.ts` files under src/ and .stackra/tests/",
        purpose: `the integration tests of ${packageName}: the unit config narrowed to the \`.int\` tier.`,
        boundary:
          "`<subject>.int.test.ts(x)` in `__tests__/`, one file after another; run by `stackra test --tier int`.",
        runtime: "node",
      }),
      'import { intTier } from "@stackra/vitest-config/int";',
      "",
      'import config from "./vitest.config";',
      "",
      "export default intTier(config);",
      "",
    ].join("\n"),
  };
}
