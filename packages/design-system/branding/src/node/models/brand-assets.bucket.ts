/**
 * Stackra file contract:
 * Purpose: `BrandAssetsBucket`, where a tenant's logo and mark are stored: public (the CDN serves them to email and
 *          storefronts), PNG or JPEG only, at most 512 KiB, with the `print`, `email` and `mark` variants.
 * Boundary: a declaration; uploads into it are signed and claimed by `MediaLibrary` (`@stackra/media`), which checks
 *           the declared type, the size and the bytes, and refuses an SVG or a renamed file. It registers its key
 *           (`branding.brand_assets`) when the module loads, so a claim stores under
 *           `public/branding/brand_assets/` (shortcut until gen writes the bucket registration, STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 2 to 4); ADR 0294 (decisions 13 and 16: `.bucket.ts` in `models/`);
 *                     STA-2644 (FR-002, decision 4).
 */
import { Bucket, BucketVisibility, registerBuckets } from "@stackra/media";

import { BRAND_ASSET_TYPES } from "#node/constants/brand-asset-types.constant";
import { BRAND_ASSET_VARIANTS } from "#node/constants/brand-asset-variants.constant";
import { BRAND_ASSETS_BUCKET_KEY } from "#node/constants/brand-assets-bucket-key.constant";

/**
 * The brand images bucket.
 *
 * @example
 * const pending = await media.createUpload(BrandAssetsBucket, { mediaType: MediaType.Png, size: file.size });
 */
export class BrandAssetsBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 512 * 1024,
  accept: BRAND_ASSET_TYPES,
  variants: BRAND_ASSET_VARIANTS,
}) {}

// shortcut: registered here until gen writes the bucket registration (STA-339).
registerBuckets([{ type: BrandAssetsBucket, key: BRAND_ASSETS_BUCKET_KEY }]);
