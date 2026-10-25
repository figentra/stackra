/**
 * Stackra file contract:
 * Purpose: `ConsentAuthorityMissingError`, the refusal of a consent given for someone the giver may not consent for
 *          (`consent_authority_missing`): no guardian link, a custody restriction, or a purpose outside it.
 * Boundary: kind `Forbidden`, not retryable, no details: it never says what the records hold.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; OS-284.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not theirs to give.
 *
 * @example
 * throw ConsentAuthorityMissingError.create();
 */
export class ConsentAuthorityMissingError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
