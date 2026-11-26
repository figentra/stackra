/**
 * Stackra file contract:
 * Purpose: `emitWiringTierConfig`, the Vitest config of a service's Encore wiring tier
 *          (`.stackra/vitest.wiring.config.ts`): the decorators preset, rooted at the member, running only the
 *          generated wiring suite, one file at a time. `stackra test --tier wiring` starts `encore test`, whose test
 *          command runs Vitest with this config inside the Encore runtime. Nobody authors it.
 * Boundary: pure; written beside the suite `emitEncoreWiringTest` writes, and only then. It loads no unit setup file:
 *           the suite boots the real server app (`.stackra/entry/server`), not a testing module.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 3: the thin Encore test suite for the wiring); ADR 0295 (decision 5: gen
 *                     writes every tool file into `.stackra/`); STA-2838.
 */
import { ENCORE_WIRING_CONFIG } from "#core/constants/encore-wiring-config.constant";
import { ENCORE_WIRING_TEST } from "#core/constants/encore-wiring-test.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";

/**
 * The wiring-tier config of `packageName`.
 *
 * @param packageName - the member's package name, for the header.
 * @example
 * emitWiringTierConfig("@figentra/service-demo").path; // ".stackra/vitest.wiring.config.ts"
 */
export function emitWiringTierConfig(packageName: string): GeneratedFile {
  return {
    path: ENCORE_WIRING_CONFIG,
    content: [
      generatedHeader({
        from: `${ENCORE_WIRING_TEST}, the generated Encore wiring suite`,
        purpose: `the Encore wiring suite of ${packageName}: the decorators preset, the wiring suite only.`,
        boundary:
          "run by `stackra test --tier wiring` under `encore test`, which provides the Encore runtime and the " +
          "migrated test database; no unit setup file, since the suite boots the real server app.",
        runtime: "node",
      }),
      'import { fileURLToPath } from "node:url";',
      "",
      'import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";',
      'import { mergeConfig } from "vitest/config";',
      "",
      "export default mergeConfig(stackraVitestDecorators, {",
      '  root: fileURLToPath(new URL("..", import.meta.url)),',
      "  test: {",
      `    include: [${JSON.stringify(ENCORE_WIRING_TEST)}],`,
      // One Encore runtime and one test database per run; the suite is one file.
      "    fileParallelism: false,",
      "  },",
      "});",
      "",
    ].join("\n"),
  };
}
