/**
 * Stackra file contract:
 * Purpose: `RefundReferenceReusedError`, the refusal of a refund whose idempotency reference the payment already used for a
 *          different amount: the same key must mean the same refund.
 * Boundary: a refusal (`conflict`, category `conflict`, 409); code `refund_reference_reused`, derived from the class name.
 *           The fields are ids only, never personal or card data.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable as it stands: the caller sends the first amount again, or a new reference.
 *
 * @example
 * throw RefundReferenceReusedError.create({ reference: "ord_1", refundReference: "r1" });
 */
export class RefundReferenceReusedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The merchant's id of the payment. */
  reference!: string;

  /** The refund's idempotency reference that was already used for another amount. */
  refundReference!: string;
}
