/**
 * Stackra file contract:
 * Purpose: `RedemptionRates`, the two values a redemption quote converts and caps by: what one point is worth and the
 *          largest share of a total points may cover.
 * Boundary: a type in the leaf entry. The values are the scope's `LoyaltyKitSettings` (`pointValueMinor`,
 *           `maxRedeemPercent`, ADR 0454 as amended by STA-1323), never config; a resolved settings group satisfies
 *           it as it is. `LoyaltyService.quote` takes it as an argument so the maths stays isomorphic.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); ADR 0220 (integer minor units); ADR 0454 (decision 2).
 */

/**
 * The scope's redemption rates.
 *
 * @example
 * const quote = await loyalty.quote(member, 500, totalMinor, await settings.get(LoyaltyKitSettings));
 */
export interface RedemptionRates {
  /** Minor units one point is worth at redemption; a whole number of one or more. */
  readonly pointValueMinor: number;

  /** Largest share of a total points may cover, as a whole percentage from 0 to 100. */
  readonly maxRedeemPercent: number;
}
