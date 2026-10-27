/**
 * Stackra file contract:
 * Purpose: `ConsentNotVerifiedError`, the refusal of a consent given for another whose verification method did not
 *          pass (`consent_not_verified`): the card check failed, the form is not on file, the guardian did not sign in.
 * Boundary: kind `Forbidden`, not retryable with the same evidence, no details: it never says what the verifier saw.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0454 (Consequences); STA-1323.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The verification did not pass.
 *
 * @example
 * throw ConsentNotVerifiedError.create();
 */
export class ConsentNotVerifiedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
