/**
 * Stackra file contract:
 * Purpose: `UploadRejectedError`, what `MediaLibrary` raises for a file its bucket does not take: a media type outside
 *          `accept`, or a size of zero or above `maxBytes`. Raised when an upload is asked for, and again at claim for
 *          what the store actually received.
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

  /** Which rule the file broke: its media type, or its size. */
  reason!: "media_type" | "size";
}
