/**
 * Stackra file contract:
 * Purpose: `EarnDraft`, the argument the `LoyaltyKitExtensionPoint.earnAdjust` slot passes each extension: who earns,
 *          at which tier, for what amount.
 * Boundary: a type in the leaf entry; an extension reads it and never changes it. The value of the `after` slot, which
 *           each extension adjusts, is the points number itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); ADR 0305 (rules 23 and 25: an `after` slot passes a value and
 *                     its arguments); STA-1383 (MoneyAmount in place of a bare
 *                     minor amount and currency).
 */
import type { MoneyAmount } from "@stackra/money/contracts";

import type { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { MemberId } from "#contracts/types/member-id.type";

/**
 * An earn in progress.
 *
 * @example
 * await extensions.earnAdjust(base, { memberId, tier, amount: { minor: 10_000, currency: "SAR" } }, ctx);
 */
export interface EarnDraft {
  /** The member who earns, branded so no other id can be passed. */
  readonly memberId: MemberId;

  /** The member's tier when the purchase was made. */
  readonly tier: LoyaltyTier;

  /** The purchase amount, with its ISO 4217 currency so an extension can refuse to scale one it does not know. */
  readonly amount: MoneyAmount;
}
