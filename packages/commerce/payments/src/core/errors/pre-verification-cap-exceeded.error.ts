/**
 * Stackra file contract:
 * Purpose: `PreVerificationCapExceededError` (`pre_verification_cap_exceeded`), the refusal of a payment on a
 *          `connected-account` connection whose owner is not verified yet, when the amount is above the cap the OS
 *          verification record allows.
 * Boundary: kind `FailedPrecondition`, never retryable: the owner finishes verification, or takes a smaller payment.
 *           Carries the merchant reference only; the cap is the host's data and never travels in the error.
 * Runtime: isomorphic
 * Governing contract: R4-6; M3-2; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The payment is above what an unverified connected account may take. */
export class PreVerificationCapExceededError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The merchant's id of the refused payment. */
  reference!: string;
}
