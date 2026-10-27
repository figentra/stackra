/**
 * Stackra file contract:
 * Purpose: `CheckoutRequest`, what a hosted checkout needs: the merchant's reference, the amount and an optional tip line,
 *          the customer, the basket, where to come back to, whether to hold, save or split, and the tender kind (a
 *          restricted program pays through the processor's hosted page and PIN pad).
 * Boundary: a type in the leaf entry. `amount` excludes `tip`; the provider is asked for both together and the record keeps
 *           the tip apart for the ledger. `reference` is the idempotency key of the payment.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2, 3 and 5); ADR 0445.
 */
import type { Money } from "@stackra/money";
import type { Party } from "@stackra/validation";

import type { TenderKind } from "#contracts/enums/tender-kind.enum";
import type { PaymentLine } from "#contracts/types/payment-line.type";
import type { PlatformShare } from "#contracts/types/platform-share.type";

/**
 * A checkout to open.
 *
 * @example
 * await payments.checkout(market, { reference: "ord_1", amount, description: "Order 1", returnUrl, cancelUrl });
 */
export interface CheckoutRequest {
  /** The merchant's id of the payment; one payment per reference. */
  readonly reference: string;

  /** The amount before any tip. */
  readonly amount: Money;

  /** A tip on top of the amount, in the same currency. */
  readonly tip?: Money;

  /** What the customer sees on the provider's page. */
  readonly description: string;

  /** The customer, when known. */
  readonly customer?: Party;

  /** The basket, when the provider itemises it. */
  readonly lines?: readonly PaymentLine[];

  /** Where the provider sends the customer after paying. */
  readonly returnUrl: string;

  /** Where the provider sends the customer who cancels or fails. */
  readonly cancelUrl: string;

  /** Authorise only; a capture follows (`PaymentCapability.Capture`). */
  readonly captureLater?: boolean;

  /** Keep the card as a token for later charges. */
  readonly saveMethod?: boolean;

  /** The page language, a BCP 47 tag. */
  readonly locale?: string;

  /** When the session stops accepting a payment; a pay link always sets it. */
  readonly expiresAt?: Date;

  /** The merchant account and platform fee, for a platform payment (`PaymentCapability.Platform`). */
  readonly platform?: PlatformShare;

  /** What the customer tenders; `card` when absent (`PaymentCapability.RestrictedTender` for `restricted`). */
  readonly tender?: TenderKind;

  /** The restricted program code, with `tender: restricted`. */
  readonly program?: string;
}
