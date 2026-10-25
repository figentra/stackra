/**
 * Stackra file contract:
 * Purpose: `RedemptionQuote`, the answer to "how much is a redemption worth right now".
 * Boundary: a type in the leaf entry, returned by `LoyaltyService.quote`; nothing is held when it is produced.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); ADR 0220 (integer minor units).
 */

/**
 * A capped redemption offer.
 *
 * @example
 * const { points, amountMinor } = await loyalty.quote(member, 500, totalMinor);
 */
export interface RedemptionQuote {
  /** Points that would be debited; may be lower than requested (balance, percentage cap). */
  readonly points: number;

  /** The discount those points buy, in minor units of the order currency. */
  readonly amountMinor: number;
}
