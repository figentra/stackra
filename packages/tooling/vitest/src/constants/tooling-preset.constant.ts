/**
 * Stackra file contract:
 * Purpose: `toolingPreset`, the vitest config of the preset packages' own tests (packages/tooling/*): plain Node,
 *          explicit `vitest` imports.
 * Boundary: test layout only.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
import { defineConfig, type ViteUserConfig } from "vitest/config";

import { UNIT_TESTS } from "./unit-tests.constant.ts";

/**
 * The preset packages' own tests (packages/tooling/*): plain Node, explicit `vitest` imports, no
 * decorators, no coverage gate and no `@stackra/source` resolution, because a preset is loaded as it
 * ships. An empty suite fails. A tooling package's vitest.config.ts is
 * `export default toolingPreset;`.
 */
export const toolingPreset: ViteUserConfig = defineConfig({
  test: { environment: "node", include: [UNIT_TESTS], passWithNoTests: false },
});
