/**
 * Stackra file contract:
 * Purpose: `PaymentUnknownError`, the refusal when a payment's last answer was lost: its state is `unknown`, and nothing may
 *          retry, capture, void or refund it until a lookup at the provider (or a manager, with a reason) settles it.
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `payment_unknown`, derived from the class name. The fields are
 *           codes and ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6); ADR 0140; ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands.
 *
 * @example
 * throw PaymentUnknownError.create({ reference: "ord_1" });
 */
export class PaymentUnknownError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The merchant's id of the payment. */
  reference!: string;
}
