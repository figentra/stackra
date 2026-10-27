/**
 * Stackra file contract:
 * Purpose: `GuardianshipMissingError`, a guardian acting for someone they may not act for here (`guardianship_missing`): no link, an ended
 *          link, a restricted purpose, or a person who is of age.
 * Boundary: kind `Forbidden`, retryable false. It never names another person or what a record holds.
 * Runtime: isomorphic
 * Governing contract: OS-284; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal for a guardian acting for someone they may not act for here.
 *
 * @example
 * throw GuardianshipMissingError.create();
 */
export class GuardianshipMissingError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
