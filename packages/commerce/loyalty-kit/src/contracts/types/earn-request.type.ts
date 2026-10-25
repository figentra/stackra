/**
 * Stackra file contract:
 * Purpose: `EarnRequest`, what a host hands `AccountService.earn`: the purchase amount and the reference the credit is
 *          idempotent on.
 * Boundary: a type in the leaf entry; the member is a separate argument, and the tier and the extensions are the kit's
 *           business.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); ADR 0220 (integer minor units).
 */

/**
 * One purchase to credit.
 *
 * @example
 * await accounts.earn(memberId(event.customerId), { amountMinor: 10_000, currency: "SAR", reference: event.orderId });
 */
export interface EarnRequest {
  /** The purchase amount in minor units of `currency`. */
  readonly amountMinor: number;

  /** ISO 4217 currency of the amount. */
  readonly currency: string;

  /** What caused the credit (an order id); a repeated reference credits nothing twice. */
  readonly reference: string;
}
