/**
 * Stackra file contract:
 * Purpose: the one tsdown preset every library's `tsdown.config.ts` calls: `export default library()`; the same
 *          function is exported as `libraryPreset`, the name generated `.stackra/tsdown.config.ts` files import
 *          (STA-339), with `LibraryPresetOptions` as its options type.
 *          ESM only as `dist/*.mjs` + `.d.mts` (ADR 0025), maps, sourcemaps, clean dist, tree-shaking. The optional decorators flag turns
 *          on the legacy-decorator transform for the DI tier.
 * Boundary: the entry barrel: names each re-export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 * Owner: release-operations · Secrets: forbidden
 */
export { libraryPreset } from "./constants/library-preset.constant.ts";
export { library } from "./functions/library.function.ts";
export type { LibraryOptions } from "./types/library-options.type.ts";
export type { LibraryPresetOptions } from "./types/library-preset-options.type.ts";
