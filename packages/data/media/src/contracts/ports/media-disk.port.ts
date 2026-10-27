/**
 * Stackra file contract:
 * Purpose: the `MediaDisk` port: the store media lives in, with the two things a plain disk lacks: a signed URL a
 *          client uploads to directly, and a server-side move out of the upload area; plus `read`, the stored bytes for
 *          server-side work (scanning, image transforms, text extraction). `MediaLibrary` injects it; config
 *          `media.disk` picks the driver (`memory`, `s3`).
 * Boundary: an abstract class that is its own token, keyed `media.MediaDisk`. Paths are made by `MediaLibrary`
 *           (`uploads/<id>`, `<visibility>/<bucket>/<id>.<ext>`), never by a client. A leaf file: it imports nothing
 *           outside `src/contracts` but the `Port` base and `Duration`.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 to 3: drivers, presigned uploads, public CDN files); ADR 0142 (drivers
 *                     behind a port); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { type Duration, Port } from "@stackra/contracts";

import type { MediaObject } from "#contracts/types/media-object.type";
import type { SignedUpload } from "#contracts/types/signed-upload.type";
import type { UploadRequest } from "#contracts/types/upload-request.type";

/**
 * The media store.
 *
 * @example
 * const target = await disk.signUpload("uploads/upl_01…", {
 *   contentType: "image/png",
 *   metadata: { bucket: "catalogue.product_images" },
 *   expiresIn: Duration.hours(1),
 * });
 */
export abstract class MediaDisk extends Port {
  /** Type-only port key, so `DriverName<MediaDisk>` narrows to this port's drivers. */
  declare readonly "~key": "media.MediaDisk";

  /** A URL that accepts one `PUT` of a file at `path` on the request's terms until it expires. */
  abstract signUpload(path: string, request: UploadRequest): Promise<SignedUpload>;

  /** The size, media type and metadata of the object at `path`; `null` when nothing is stored there. */
  abstract stat(path: string): Promise<MediaObject | null>;

  /**
   * The bytes of the object at `path`, for server-side processing only; a client reads through `url` or `temporaryUrl`.
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when nothing is stored at `path`.
   */
  abstract read(path: string): Promise<Uint8Array>;

  /**
   * Moves the object at `from` to `to`, keeping its media type, inside the store.
   *
   * @throws FileNotFoundError (from `@stackra/filesystem`) when nothing is stored at `from`.
   */
  abstract move(from: string, to: string): Promise<void>;

  /**
   * Removes the object at `path`.
   *
   * @returns true when an object was removed; false when there was none.
   */
  abstract delete(path: string): Promise<boolean>;

  /**
   * The public URL of `path`. It does not check that the object exists; a CDN serves only `public/`.
   *
   * @throws TypeError when the store has no public URL (`filesystem.url` is not set).
   */
  abstract url(path: string): string;

  /** A URL that reads `path` until `expiresIn` has passed, for a file in a private bucket. */
  abstract temporaryUrl(path: string, expiresIn: Duration): Promise<string>;
}
