/**
 * Stackra file contract:
 * Purpose: `emitTierConfig`, the Vitest config of an infixed test tier gen writes into `.stackra/` for a member that
 *          has a test of that tier: the generated unit config narrowed by the tier's wrapper from
 *          `@stackra/vitest-config` (`intTier` from `./int` for `.int.test.ts`, `contractTier` from `./contract` for
 *          `.contract.test.ts`), so `stackra test --tier <tier>` keeps the preset, the aliases and the generated setup
 *          and runs only that tier's files. Nobody authors a `vitest.int.config.ts` or a `vitest.contract.config.ts`.
 * Boundary: pure. The caller decides whether the member has a test of the tier (it reads the disk) and writes this
 *           file beside `.stackra/vitest.config.ts`; the file imports that config, so it is only valid when that one is
 *           written.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: gen writes every tool file into `.stackra/`); ADR 0182 (decisions 1 and 4:
 *                     test tiers, the contract tier); STA-1570 (`intTier`); STA-1819; STA-2837 (`contractTier`).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** What each tier's config names and imports. */
const TIERS = {
  int: { wrapper: "intTier", tests: "integration tests", order: "one file after another" },
  contract: { wrapper: "contractTier", tests: "contract tests", order: "files in parallel" },
} as const;

/**
 * The `tier` config of `packageName`.
 *
 * @param packageName - the member's package name, for the header.
 * @param tier - the infixed tier: `int` or `contract`.
 * @example
 * emitTierConfig("@figentra/service-demo", "int").path; // ".stackra/vitest.int.config.ts"
 * emitTierConfig("@figentra/service-demo", "contract").path; // ".stackra/vitest.contract.config.ts"
 */
export function emitTierConfig(packageName: string, tier: keyof typeof TIERS): GeneratedFile {
  const { wrapper, tests, order } = TIERS[tier];
  return {
    path: `.stackra/vitest.${tier}.config.ts`,
    content: [
      generatedHeader({
        from: `.stackra/vitest.config.ts and the \`.${tier}.test.ts\` files under src/ and .stackra/tests/`,
        purpose: `the ${tests} of ${packageName}: the unit config narrowed to the \`.${tier}\` tier.`,
        boundary: `\`<subject>.${tier}.test.ts(x)\` in \`__tests__/\`, ${order}; run by \`stackra test --tier ${tier}\`.`,
        runtime: "node",
      }),
      `import { ${wrapper} } from "@stackra/vitest-config/${tier}";`,
      "",
      'import config from "./vitest.config";',
      "",
      `export default ${wrapper}(config);`,
      "",
    ].join("\n"),
  };
}
