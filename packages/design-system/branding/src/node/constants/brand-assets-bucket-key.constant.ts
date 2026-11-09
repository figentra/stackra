/**
 * Stackra file contract:
 * Purpose: `BRAND_ASSETS_BUCKET_KEY`, the key of `BrandAssetsBucket`: `branding.brand_assets`, the key gen derives
 *          from `branding/models/brand-assets.bucket.ts`.
 * Boundary: data only; internal. The bucket registers itself under it, and `BrandReader` finds a claimed file's path
 *           by it, so a claim and a read agree on where the file lives.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: derived identities); ADR 0222 (decision 1: key layout); STA-2644.
 */

/** The bucket key. */
export const BRAND_ASSETS_BUCKET_KEY = "branding.brand_assets";
