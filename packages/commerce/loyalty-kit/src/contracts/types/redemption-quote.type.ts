/**
 * Stackra file contract:
 * Purpose: `RedemptionQuote`, the answer to "how much is a redemption worth right now".
 * Boundary: a type in the leaf entry, returned by `LoyaltyService.quote`; nothing is held when it is produced.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); ADR 0220 (integer minor units); STA-1383 (MoneyAmount in place of a bare
 *                     minor amount and currency).
 */
import type { MoneyAmount } from "@stackra/money/contracts";

/**
 * A capped redemption offer.
 *
 * @example
 * const { points, amount } = await loyalty.quote(member, 500, total, rates);
 */
export interface RedemptionQuote {
  /** Points that would be debited; may be lower than requested (balance, percentage cap). */
  readonly points: number;

  /** The discount those points buy, in the order's currency. */
  readonly amount: MoneyAmount;
}
