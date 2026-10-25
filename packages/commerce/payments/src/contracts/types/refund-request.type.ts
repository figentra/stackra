/**
 * Stackra file contract:
 * Purpose: `RefundRequest`, a refund of a captured payment, in full or in part.
 * Boundary: a type in the leaf entry; `reference` identifies this refund and is its idempotency key.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { Money } from "@stackra/money";

import type { PaymentTarget } from "#contracts/types/payment-target.type";

/**
 * Give money back.
 *
 * @example
 * await gateway.refund({ payment: { reference, providerRef }, amount, reference: "rfd_1", reason: "returned" });
 */
export interface RefundRequest {
  /** The captured payment. */
  readonly payment: PaymentTarget;

  /** How much to give back. */
  readonly amount: Money;

  /** This refund's id. */
  readonly reference: string;

  /** Why, as free text the provider stores. */
  readonly reason?: string;
}
