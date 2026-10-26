/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/brand-kit until `stackra gen` writes the entry barrels
 *          (STA-339): the generator run, the kit reader, discovery and folder check, the outliner and font loader, the
 *          rasteriser, the store-frame planner, the file lister and the command line runner with its io type.
 * Boundary: names each re-export and declares nothing. Node only: it reads and writes files. Exports none of `.`'s
 *           symbols.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { checkKitFolder } from "#node/functions/check-kit-folder.function";
export { findKits } from "#node/functions/find-kits.function";
export { generateBrand } from "#node/functions/generate-brand.function";
export { listFiles } from "#node/functions/list-files.function";
export { loadFont } from "#node/functions/load-font.function";
export { outlineText } from "#node/functions/outline-text.function";
export { planStoreFrames } from "#node/functions/plan-store-frames.function";
export { rasterizeSvg } from "#node/functions/rasterize-svg.function";
export { readKit } from "#node/functions/read-kit.function";
export { runBrandKit } from "#node/functions/run-brand-kit.function";
export type { BrandKitIo } from "#node/types/brand-kit-io.type";
