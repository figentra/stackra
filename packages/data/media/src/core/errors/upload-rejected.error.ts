/**
 * Stackra file contract:
 * Purpose: `UploadRejectedError`, what `MediaLibrary` raises for a file its bucket does not take: a media type outside
 *          `accept`, a size of zero or above `maxBytes`, bytes that are not the media type the upload declared, or (at
 *          claim and store) a file the malware scanner found a threat in (`malware`) or could not scan
 *          (`unscannable`). Raised when an upload is asked for, and again at claim for what the store actually
 *          received.
 * Boundary: kind `Validation`, code `upload_rejected`. The details name the bucket and the broken rule, never the file.
 *           At claim the received file is deleted before this is raised. The threat name never reaches the details.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (decision 2: the scan before a file is
 *                     available).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: the same file is refused again. */
export class UploadRejectedError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The bucket key. */
  bucket!: string;

  /**
   * Which rule the file broke: its declared media type, its size, its content (bytes of another type), a threat the
   * scanner found, or a file the scanner could not scan.
   */
  reason!: "media_type" | "size" | "content" | "malware" | "unscannable";
}
