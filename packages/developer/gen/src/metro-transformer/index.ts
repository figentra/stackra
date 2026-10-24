/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./metro-transformer` tool hook of @stackra/gen, the module of fixed shape Metro loads
 *          as its Babel transformer (`transform` and `getCacheKey`), until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing; Metro needs exactly these two names.
 * Runtime: node
 * Governing contract: ADR 0127 2026-10-24 note (`@stackra/gen/metro-transformer` is an allowed tool-hook subpath);
 *                     ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { getCacheKey } from "#metro-transformer/functions/get-cache-key.function";
export { transform } from "#metro-transformer/functions/transform.function";
export type { MetroTransformParams } from "#metro-transformer/types/metro-transform-params.type";
