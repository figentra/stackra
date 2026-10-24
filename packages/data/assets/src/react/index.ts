/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/assets (`useAsset`) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names its one re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useAsset } from "#react/asset/use-asset";
