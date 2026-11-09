/**
 * Stackra file contract:
 * Purpose: `ResolvedBrand`, a template's brand slot read from the render data: the logo placed above the first block and
 *          the accent the title and the table rules take.
 * Boundary: a type only. Either part is `null` when the template names none or the data's value is not usable (not a
 *           PNG or JPEG asset, not a `#RRGGBB` colour): a brand never fails a document.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 1); STA-2644 (FR-005).
 */
import type { ImageAsset } from "#core/types/image-asset.type";

/** A document's brand, resolved. */
export interface ResolvedBrand {
  /** The logo above the first block; `null` for none. */
  readonly logo: ImageAsset | null;

  /** The accent colour, `#RRGGBB`; `null` keeps black. */
  readonly accent: string | null;
}
