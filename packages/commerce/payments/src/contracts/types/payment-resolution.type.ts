/**
 * Stackra file contract:
 * Purpose: `PaymentResolution`, who settled an `unknown` payment by hand, why, and when.
 * Boundary: a type in the leaf entry; kept on the record for audit.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6: a manager may resolve it by hand, with a reason).
 */

/**
 * A manual resolution.
 *
 * @example
 * await payments.resolve(reference, PaymentStatus.Captured, { by: actor.id, reason: "Receipt printed" });
 */
export interface PaymentResolution {
  /** The principal who resolved it. */
  readonly by: string;

  /** Why, in their words. */
  readonly reason: string;

  /** When. */
  readonly at: Date;
}
