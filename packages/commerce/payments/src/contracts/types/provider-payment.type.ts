/**
 * Stackra file contract:
 * Purpose: `ProviderPayment`, one payment as its provider reports it now.
 * Boundary: a type in the leaf entry; what `lookup`, `capture`, `void`, `charge` return. `providerRef` is the id later calls
 *           use, which may differ from the session id a checkout returned.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 6).
 */
import type { Money } from "@stackra/money";

import type { PaymentStatus } from "#contracts/enums/payment-status.enum";
import type { SavedMethod } from "#contracts/types/saved-method.type";

/**
 * The provider's view.
 *
 * @example
 * const found = await gateway.lookup({ reference });
 */
export interface ProviderPayment {
  /** The provider's id of the payment. */
  readonly providerRef: string;

  /** Its state, mapped. */
  readonly status: PaymentStatus;

  /** The amount the provider holds or took, tip included. */
  readonly amount: Money;

  /** The tip the customer added at the provider (a terminal prompt), when there is one. */
  readonly tip?: Money;

  /** The token saved with this payment, when the customer agreed to save it. */
  readonly method?: SavedMethod;
}
