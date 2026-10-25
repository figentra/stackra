/**
 * Stackra file contract:
 * Purpose: `UploadExpiredError`, what `MediaLibrary.claim` raises for a token claimed after its expiry
 *          (`media.uploadExpiresIn` after it was issued).
 * Boundary: kind `FailedPrecondition`, code `upload_expired`, no details. The client uploads the file again.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (decision 2).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: only a new upload succeeds. */
export class UploadExpiredError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
