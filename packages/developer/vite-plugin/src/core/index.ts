/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/vite-plugin until `stackra gen` writes the entry barrels
 *          (STA-339): the `stackra` preset and the type of `stackra.viteConfig`'s options.
 * Boundary: names each re-export and declares nothing. Node only: the preset runs inside a Vite build.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { stackra } from "#core/functions/stackra.function";
export type { ViteConfigOptions } from "#core/types/vite-config-options.type";
