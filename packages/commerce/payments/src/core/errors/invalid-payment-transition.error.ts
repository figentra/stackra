/**
 * Stackra file contract:
 * Purpose: `InvalidPaymentTransitionError`, the refusal of an operation the payment's state does not allow: a capture of a captured
 *          payment, a refund above what was taken, a manual resolution of a payment that is not `unknown`.
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `invalid_payment_transition`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 6); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw InvalidPaymentTransitionError.create({ reference: "ord_1", status: "voided", operation: "capture" });
 */
export class InvalidPaymentTransitionError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The merchant's id of the payment. */
  reference!: string;

  /** Its state now. */
  status!: string;

  /** What was asked (`capture`, `void`, `refund`, `checkout`, `resolve`). */
  operation!: string;
}
