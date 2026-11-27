/**
 * Stackra file contract:
 * Purpose: `ScanPendingError`, what `MediaLibrary` raises when the malware scanner has not decided on a file yet (an
 *          asynchronous scanner such as GuardDuty, which tags the object some time after it lands): at claim, at
 *          store, and when a private file is linked.
 * Boundary: kind `Unavailable`, code `scan_pending`; the one detail is the upload id the caller finishes with
 *           (`claim(upload, bucket)` again, after a while), never a threat name or the file. Nothing is placed at a
 *           served path while a scan is pending (ADR 0222: an unscanned file is never served).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (decision 2 and the
 *                     consequence "an unscanned file is never served").
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Retryable: the same call succeeds once the scanner has decided that the file is clean. */
export class ScanPendingError extends Refusal({ kind: ErrorKind.Unavailable }) {
  /** The upload id (`upl_…`) to claim again later. */
  upload!: string;
}
