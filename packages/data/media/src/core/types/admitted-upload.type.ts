/**
 * Stackra file contract:
 * Purpose: `AdmittedUpload`, what `MediaLibrary.admitResumableUpload` answers when a tus server may start an upload:
 *          the id to store it under and the media type to store it as.
 * Boundary: a type only; both values come from the server's own record, never from the tus creation request.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: tus uploads).
 */
import type { PublicId } from "@stackra/contracts";

import type { MediaType } from "#core/enums/media-type.enum";

/** A tus upload the server admitted. */
export interface AdmittedUpload {
  /** The upload id: the tus server stores the bytes as `uploads/<id>`, beside the record. */
  readonly id: PublicId<"upl">;

  /** The media type admitted at creation: the tus server stores the bytes with it (`filetype`). */
  readonly mediaType: MediaType;
}
