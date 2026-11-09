/**
 * Stackra file contract:
 * Purpose: `BRAND_ASSET_TYPES`, the media types a brand image may have: PNG and JPEG, never SVG.
 * Boundary: data only; internal. `BrandAssetsBucket` accepts them and `BrandReader` looks a stored file up by them.
 *           Media checks an upload's bytes against its declared type at claim, so a renamed file is refused there.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2); STA-2644 (FR-002: an SVG can run script in a PDF engine or mail client).
 */
import { MediaType } from "@stackra/media";

/** PNG first: the type a logo is most often uploaded as. */
export const BRAND_ASSET_TYPES: readonly MediaType[] = Object.freeze([
  MediaType.Png,
  MediaType.Jpeg,
]);
