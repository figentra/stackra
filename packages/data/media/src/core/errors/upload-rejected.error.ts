/**
 * Stackra file contract:
 * Purpose: `UploadRejectedError`, what `MediaLibrary` raises for a file its bucket does not take: a media type outside
 *          `accept`, a size of zero or above `maxBytes`, or (at claim) bytes that are not the media type the upload
 *          declared. Raised when an upload is asked for, and again at claim for what the store actually received.
 * Boundary: kind `Validation`, code `upload_rejected`. The details name the bucket and the broken rule, never the file.
 *           At claim the received file is deleted before this is raised.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (decision 2).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: the same file is refused again. */
export class UploadRejectedError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The bucket key. */
  bucket!: string;

  /** Which rule the file broke: its declared media type, its size, or its content (bytes of another type). */
  reason!: "media_type" | "size" | "content";
}
