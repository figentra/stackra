/**
 * Stackra file contract:
 * Purpose: `UploadRequest`, what `MediaDisk.signUpload` binds into a signed upload URL: the media type, the metadata
 *          the store keeps with the object, and how long the URL stays valid.
 * Boundary: a type only. The metadata is signed, so the client cannot change it; names are lowercase words.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: presigned uploads); ADR 0294 (decision 15: types live in the contracts
 *                     leaf).
 */
import type { Duration } from "@stackra/contracts";

/** The terms of one signed upload. */
export interface UploadRequest {
  /** The media type the client must send (`image/png`); the store refuses another. */
  readonly contentType: string;

  /** Signed metadata the store keeps with the object (`{ bucket: "catalogue.product_images" }`). */
  readonly metadata: Readonly<Record<string, string>>;

  /** How long the URL accepts the upload. */
  readonly expiresIn: Duration;
}
