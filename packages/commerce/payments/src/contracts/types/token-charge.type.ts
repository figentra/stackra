/**
 * Stackra file contract:
 * Purpose: `TokenCharge`, a charge on a saved token, customer- or merchant-initiated.
 * Boundary: a type in the leaf entry; a merchant-initiated charge needs `method.merchantInitiated`.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5).
 */
import type { Money } from "@stackra/money";

import type { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import type { SavedMethod } from "#contracts/types/saved-method.type";

/**
 * Charge a token.
 *
 * @example
 * await payments.charge({ reference: "inv_7", method, amount, initiator: ChargeInitiator.Merchant });
 */
export interface TokenCharge {
  /** The merchant's id of the payment; one payment per reference. */
  readonly reference: string;

  /** The token. */
  readonly method: SavedMethod;

  /** How much. */
  readonly amount: Money;

  /** Who starts it. */
  readonly initiator: ChargeInitiator;

  /** What the customer's statement shows. */
  readonly description?: string;
}
