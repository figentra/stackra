/**
 * Stackra file contract:
 * Purpose: `BRAND_ASSET_VARIANTS`, the boxes of the three brand image variants: `print` 600 px wide, `email` 400 px
 *          wide and `mark` 512 × 512 px.
 * Boundary: data only; internal. `BrandAssetsBucket` declares them and `BrandReader` builds each variant's URL from
 *           them, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants); STA-2644 (FR-002).
 */
import type { ImageVariantOptions } from "@stackra/media";

import type { BrandImageVariants } from "#contracts/index";

/** The variant boxes, in CSS pixels. */
export const BRAND_ASSET_VARIANTS: BrandImageVariants<ImageVariantOptions> = Object.freeze({
  print: { width: 600 },
  email: { width: 400 },
  mark: { width: 512, height: 512 },
});
