/**
 * Stackra file contract:
 * Purpose: `LoyaltyTierPolicy`, the port that decides which tier a member should hold after an earn: the hook a host
 *          uses to replace the kit's balance thresholds with its own tier rules.
 * Boundary: an abstract class that is its own token, key `loyalty_kit.LoyaltyTierPolicy`. The kit ships one driver,
 *           `threshold` (the `LoyaltyKitSettings.tiers` thresholds); a host swaps in its own class with
 *           `@Replaces(LoyaltyTierPolicy)`. It only answers: `RecalculateTierListener` applies the answer, and only
 *           ever to raise a tier, so a policy cannot demote. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0263 (ports resolve by type); ADR 0454 (decision 3).
 */
import { Port } from "@stackra/contracts";

import type { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { TierDraft } from "#contracts/types/tier-draft.type";

/**
 * Which tier an earn earns. A host's class carries the `Replaces(LoyaltyTierPolicy)` decorator.
 *
 * @example
 * export class SegmentTierPolicy extends LoyaltyTierPolicy {
 *   async tierFor(draft: TierDraft): Promise<LoyaltyTier> { … }
 * }
 */
export abstract class LoyaltyTierPolicy extends Port {
  /** Type-only port key, so `DriverName<LoyaltyTierPolicy>` narrows to this port's drivers. */
  declare readonly "~key": "loyalty_kit.LoyaltyTierPolicy";

  /** The tier `draft.memberId` should hold now; a tier at or below `draft.current` changes nothing. */
  abstract tierFor(draft: TierDraft): Promise<LoyaltyTier>;
}
