/**
 * Stackra file contract:
 * Purpose: `MediaFile`, what `MediaLibrary.claim` returns: the claimed file's id, bucket, stored path, URL, media type
 *          and size, for the claiming action to record.
 * Boundary: a type only. `url` is stable: the CDN serves it for a public bucket; for a private bucket it is the
 *           file's address, readable only through `MediaLibrary.temporaryUrl`.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 and 3).
 */
import type { PublicId } from "@stackra/contracts";

import type { MediaType } from "#core/enums/media-type.enum";

/** One claimed file. */
export interface MediaFile {
  /** The id it was uploaded under. */
  readonly id: PublicId<"upl">;

  /** The bucket key (`catalogue.product_images`). */
  readonly bucket: string;

  /** The stored path (`public/catalogue/product_images/upl_….png`). */
  readonly path: string;

  /** The file's URL. */
  readonly url: string;

  /** The media type it was uploaded with. */
  readonly mediaType: MediaType;

  /** Size in bytes. */
  readonly size: number;
}
