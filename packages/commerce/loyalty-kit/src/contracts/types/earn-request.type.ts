/**
 * Stackra file contract:
 * Purpose: `EarnRequest`, what a host hands `AccountService.earn`: the purchase amount and the reference the credit is
 *          idempotent on.
 * Boundary: a type in the leaf entry; the member is a separate argument, and the tier and the extensions are the kit's
 *           business.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); ADR 0220 (integer minor units); STA-1383 (MoneyAmount in place of a bare
 *                     minor amount and currency).
 */
import type { MoneyAmount } from "@stackra/money/contracts";

/**
 * One purchase to credit.
 *
 * @example
 * await accounts.earn(memberId(event.customerId), { amount: { minor: 10_000, currency: "SAR" }, reference: event.orderId });
 */
export interface EarnRequest {
  /** The purchase amount: minor units and ISO 4217 currency. */
  readonly amount: MoneyAmount;

  /** What caused the credit (an order id); a repeated reference credits nothing twice. */
  readonly reference: string;
}
