/**
 * Stackra file contract:
 * Purpose: `TierDraft`, what the `LoyaltyTierPolicy` port is asked about after an earn: who, the tier they hold and the
 *          balance the earn left.
 * Boundary: a type in the leaf entry; a policy reads it and never changes it. Built by `RecalculateTierListener` from
 *           `loyalty_kit.points.earned.v2`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0454 (decision 3: the tier hook).
 */
import type { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { MemberId } from "#contracts/types/member-id.type";

/**
 * An earn whose tier is to be decided.
 *
 * @example
 * const tier = await policy.tierFor({ memberId, current: account.tier, balanceAfter: event.balanceAfter });
 */
export interface TierDraft {
  /** The member who earned. */
  readonly memberId: MemberId;

  /** The tier the account holds now. */
  readonly current: LoyaltyTier;

  /** The member's balance after the earn. */
  readonly balanceAfter: number;
}
