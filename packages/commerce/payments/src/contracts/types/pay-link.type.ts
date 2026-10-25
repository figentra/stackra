/**
 * Stackra file contract:
 * Purpose: `PayLink`, a link a merchant sends (by WhatsApp, email or SMS) that opens a checkout for a fixed amount until it
 *          expires.
 * Boundary: a type in the leaf entry; the URL is the provider's hosted page.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2: the branded payments surface); COM-123; MUS-122.
 */

/**
 * A link to pay.
 *
 * @example
 * const link = await payments.payLink(market, { ...request, expiresAt });
 */
export interface PayLink {
  /** The merchant's id of the payment. */
  readonly reference: string;

  /** The page the customer opens. */
  readonly url: string;

  /** When the link stops accepting a payment. */
  readonly expiresAt: Date;
}
