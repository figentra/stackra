/**
 * Stackra file contract:
 * Purpose: `UploadIncompleteError`, what `MediaLibrary.claim` raises when nothing waits under the token: the client
 *          never finished the upload, it was already claimed, or the store swept it.
 * Boundary: kind `FailedPrecondition`, code `upload_incomplete`, no details, so a guessed id learns nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (decision 2).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable as it is: the client finishes the upload or starts a new one. */
export class UploadIncompleteError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
