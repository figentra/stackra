/**
 * Stackra file contract:
 * Purpose: `SavedMethod`, a card or account kept at the provider as a token, with the flag that allows merchant-initiated
 *          charges on it.
 * Boundary: a type in the leaf entry. Only the token, never a card number (PCI SAQ-A); the token is bound to the connection
 *           that made it, so a charge goes back to that connection.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5).
 */

/**
 * A gateway token.
 *
 * @example
 * if (method.merchantInitiated) await payments.charge({ reference, method, amount, initiator: ChargeInitiator.Merchant });
 */
export interface SavedMethod {
  /** The provider code of the connection that made the token. */
  readonly provider: string;

  /** That connection's id. */
  readonly connectionId: string;

  /** The provider's token. */
  readonly token: string;

  /** Whether the customer agreed to charges the merchant starts. */
  readonly merchantInitiated: boolean;

  /** The provider's customer id the token belongs to, when it has one. */
  readonly customerRef?: string;

  /** Card brand, for display. */
  readonly brand?: string;

  /** Last four digits, for display. */
  readonly last4?: string;
}
