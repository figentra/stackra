/**
 * Stackra file contract:
 * Purpose: `SharedItem`, one thing another app's share sheet handed to this app: a text, a link or a file (a photo,
 *          a PDF), with its media type and, for a file, its name.
 * Boundary: a type only. Device-local data: it never leaves the device until the person acts on it, and a file's
 *           bytes are read through `IncomingShare.read`, never from `value` directly.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (share target); ADR 0478 (decision 9).
 */

/** One shared item. */
export interface SharedItem {
  /** What was shared: `text`, a web `url` or a `file`. */
  readonly kind: "text" | "url" | "file";

  /** The text, the link, or the file's local URI on the device. */
  readonly value: string;

  /** The media type (`image/jpeg`, `application/pdf`, `text/plain`). */
  readonly mimeType: string;

  /** The file's name as the other app gave it; `null` for a text or a link. */
  readonly name: string | null;
}
