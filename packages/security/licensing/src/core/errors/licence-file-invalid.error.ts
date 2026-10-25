/**
 * Stackra file contract:
 * Purpose: `LicenceFileInvalidError`, the refusal `verifyLicenceFile` throws for a file it cannot trust: not a licence
 *          file, an algorithm it does not know, a signature that does not verify, or an encrypted file it cannot open.
 * Boundary: kind `FailedPrecondition`, code `licence_file_invalid`, not retryable (the same file fails again). Its one
 *           detail is a snake_case `reason`; never the file, the licence key or the verify key. An expired licence is
 *           not invalid: expiry is a standing (`licenceStanding`), never a refusal (ADR 0178 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0178 (decisions 1 and 4); ADR 0294 (decisions 16 and 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The file cannot be trusted; `reason` says why. */
export class LicenceFileInvalidError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** `malformed`, `unsupported_algorithm`, `bad_signature`, `licence_key_required` or `decryption_failed`. */
  reason!: string;
}
