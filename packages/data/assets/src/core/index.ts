/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/assets (`assets`, which the generated `#stackra/assets` calls,
 *          the `AssetLibrary` service and the types they use) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The key parser and the path check stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { AssetHashMismatchError } from "#core/errors/asset-hash-mismatch.error";
export { assets } from "#core/functions/assets.function";
export { AssetLibrary } from "#core/services/asset-library.service";
export type { AssetEntry } from "#core/types/asset-entry.type";
export type { AssetKey } from "#core/types/asset-key.type";
export type { AssetTree } from "#core/types/asset-tree.type";
export type { ResolvedAsset } from "#core/types/resolved-asset.type";
