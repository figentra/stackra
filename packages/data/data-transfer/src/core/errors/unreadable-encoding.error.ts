/**
 * Stackra file contract:
 * Purpose: `UnreadableEncodingError` (`unreadable_encoding`), the refusal of a CSV file whose encoding cannot be
 *          detected (no byte order mark, not UTF-8, no fallback given) or whose bytes do not decode in its encoding.
 * Boundary: a validation refusal (400), never retryable: the user re-saves the file or picks an encoding. Its detail
 *           is the encoding tried, absent when none was found.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 3); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The file's text cannot be read. */
export class UnreadableEncodingError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The encoding that failed (`utf-8`); absent when no encoding was found. */
  encoding?: string;
}
