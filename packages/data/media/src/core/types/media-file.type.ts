/**
 * Stackra file contract:
 * Purpose: `MediaFile`, what `MediaLibrary.claim` and `store` return: the file's id, bucket, stored path, URL, media
 *          type, size and malware-scan verdict, for the claiming action to record.
 * Boundary: a type only. `url` is stable: the CDN serves it for a public bucket; for a private bucket it is the
 *           file's address, readable only through `MediaLibrary.temporaryUrl`. `scan` is the scanner's verdict when the
 *           file was placed, always `clean` for a file `MediaLibrary` returns (it places nothing else); a record without
 *           it (made before scanning existed) is scanned again before `temporaryUrl` links it.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 to 3; an unscanned file is never served).
 */
import type { PublicId } from "@stackra/contracts";

import type { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
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

  /** The malware scanner's verdict on the file: `clean` for every file `MediaLibrary` placed. */
  readonly scan: ScanVerdict;
}
