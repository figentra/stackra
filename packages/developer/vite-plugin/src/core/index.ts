/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/vite-plugin until `stackra gen` writes the entry barrels
 *          (STA-339): the `stackra` preset, the type of `stackra.viteConfig`'s options and, for the
 *          extension-bundle build, the type of `stackra.bundleConfig`'s options and of a shell's import map.
 * Boundary: names each re-export and declares nothing. Node only: the preset runs inside a Vite build.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note; ADR 0436
 *                     (decision 4).
 */
export { stackra } from "#core/functions/stackra.function";
export type { BundleConfigOptions } from "#core/types/bundle-config-options.type";
export type { ImportMap } from "#core/types/import-map.type";
export type { ViteConfigOptions } from "#core/types/vite-config-options.type";
