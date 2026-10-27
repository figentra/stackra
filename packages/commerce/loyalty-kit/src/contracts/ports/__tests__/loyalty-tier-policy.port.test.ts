/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyTierPolicy`: an abstract port a host implements to decide the tier after an earn.
 * Boundary: test only; a minimal host policy stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0454 (decision 3).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyTierPolicy } from "#contracts/ports/loyalty-tier-policy.port";
import type { MemberId } from "#contracts/types/member-id.type";
import type { TierDraft } from "#contracts/types/tier-draft.type";

/** A host rule: everyone is gold. */
class EveryoneGold extends LoyaltyTierPolicy {
  async tierFor(_draft: TierDraft): Promise<LoyaltyTier> {
    return LoyaltyTier.Gold;
  }
}

describe("LoyaltyTierPolicy", () => {
  it("is an abstract port the host answers", async () => {
    const policy = new EveryoneGold();
    expect(policy).toBeInstanceOf(Port);
    expect(
      await policy.tierFor({
        memberId: "usr_1" as MemberId,
        current: LoyaltyTier.Bronze,
        balanceAfter: 0,
      }),
    ).toBe(LoyaltyTier.Gold);
  });
});
