/**
 * Stackra file contract:
 * Purpose: `IncrementRequest`, a raise of the amount an authorised payment holds (incremental authorisation).
 * Boundary: a type in the leaf entry; `amount` is what is added to the hold, not the new total, and `reference`
 *           identifies this increment and is its idempotency key at the provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); STA-1024.
 */
import type { Money } from "@stackra/money";

import type { PaymentTarget } from "#contracts/types/payment-target.type";

/**
 * Hold more.
 *
 * @example
 * await gateway.increment({ payment: { reference, providerRef }, amount, reference: "tab_7:round_2" });
 */
export interface IncrementRequest {
  /** The authorised payment. */
  readonly payment: PaymentTarget;

  /** How much to add to the hold. */
  readonly amount: Money;

  /** This increment's id. */
  readonly reference: string;
}
