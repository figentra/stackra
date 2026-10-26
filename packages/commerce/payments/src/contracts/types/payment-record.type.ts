/**
 * Stackra file contract:
 * Purpose: `PaymentRecord`, the engine's own state of one payment: which connection serves it, what the provider last
 *          said, what was refunded, and how an `unknown` state was settled.
 * Boundary: a type in the leaf entry; stored through the `PaymentRecords` port. Amounts are `Money`; the tip stays apart from
 *           the amount so the ledger can post it on its own line.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 6); ADR 0220.
 */
import type { Money } from "@stackra/money";

import type { PaymentStatus } from "#contracts/enums/payment-status.enum";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { PaymentResolution } from "#contracts/types/payment-resolution.type";
import type { SavedMethod } from "#contracts/types/saved-method.type";

/**
 * The stored record of one payment.
 *
 * @example
 * const record = await records.find("ord_1");
 */
export interface PaymentRecord {
  /** The merchant's id of the payment. */
  readonly reference: string;

  /** The provider code of the serving connection. */
  readonly provider: string;

  /** The serving connection's id. */
  readonly connectionId: string;

  /** The provider's id, once known. */
  readonly providerRef?: string;

  /** The amount before any tip. */
  readonly amount: Money;

  /** The tip, when there is one. */
  readonly tip?: Money;

  /** What has been refunded so far. */
  readonly refunded: Money;

  /** Where it stands. */
  readonly status: PaymentStatus;

  /** The terminal, for a terminal payment. */
  readonly terminalId?: string;

  /** The open checkout, for a hosted or pay-link payment. */
  readonly session?: CheckoutSession;

  /** The token saved with it, when the customer agreed. */
  readonly method?: SavedMethod;

  /** How an `unknown` state was settled by hand. */
  readonly resolution?: PaymentResolution;

  /** When the record last changed. */
  readonly updatedAt: Date;
}
