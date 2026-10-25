/**
 * Stackra file contract:
 * Purpose: `VerificationUnavailableError`, no provider the market pack lists could answer a check now (`verification_unavailable`).
 * Boundary: kind `Unavailable`, retryable true. It never names another person or what a record holds.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); OS-54; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal.
 *
 * @example
 * throw VerificationUnavailableError.create();
 */
export class VerificationUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
