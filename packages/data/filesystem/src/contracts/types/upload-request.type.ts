/**
 * Stackra file contract:
 * Purpose: `UploadRequest`, what `FileSystem.signUpload` binds into a signed upload URL: the media type and how long
 *          the URL stays valid.
 * Boundary: a type only. No client metadata: a disk that cannot sign metadata (an Encore bucket) would drop it, so a
 *           caller that must remember facts about an upload (media's bucket key and expiry) writes them itself next
 *           to the upload. Moved here from @stackra/media's `MediaDisk` (stackra-226).
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: presigned uploads); ADR 0234 (decision 7); ADR 0294 (decision 15: types
 *                     live in the contracts leaf).
 */
import type { Duration } from "@stackra/contracts";

/** The terms of one signed upload. */
export interface UploadRequest {
  /** The media type the client must send (`image/png`); a store that signs it refuses another. */
  readonly contentType: string;

  /** How long the URL accepts the upload. */
  readonly expiresIn: Duration;
}
