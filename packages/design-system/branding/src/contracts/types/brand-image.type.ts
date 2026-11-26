/**
 * Stackra file contract:
 * Purpose: `BrandImage`, a resolved brand image (the logo or the mark): the stored file's id, URL and media type, and
 *          the URL of each of its variants.
 * Boundary: a type in the leaf entry, part of `BrandProfile`. The URLs are the media disk's public URLs; nothing here
 *           fetches. A PDF renderer that must not fetch reads the bytes itself and inlines them.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 3 and 4); ADR 0294 (as amended by programming model v3.1, AGENTS.md; rule
 *                     R8); STA-2644.
 */
import type { PublicId } from "@stackra/contracts";
import type { MediaType } from "@stackra/media";

import type { BrandImageVariants } from "#contracts/types/brand-image-variants.type";

/**
 * One stored brand image.
 *
 * @example
 * const logo = profile.logo?.variants.print.url;
 */
export interface BrandImage {
  /** The upload id the file was claimed under (`upl_…`). */
  readonly id: PublicId<"upl">;

  /** The original's URL; a surface uses a variant instead. */
  readonly url: string;

  /** PNG or JPEG. */
  readonly mediaType: MediaType;

  /** The resized images. */
  readonly variants: BrandImageVariants;
}
