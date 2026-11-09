/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/branding (`BrandAssetsBucket`, where the brand images are
 *          stored, and `BrandReader`, which resolves a `BrandProfile`) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Server code: it reads the media disk.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { BrandAssetsBucket } from "#node/models/brand-assets.bucket";
export { BrandReader } from "#node/services/brand-reader.service";
