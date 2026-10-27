/**
 * Stackra file contract:
 * Purpose: unit tests of `RecalculateTierListener`: over the threshold policy, an earn whose balance after crosses the
 *          gold threshold promotes the account, one that crosses silver promotes to silver, and a lower balance never
 *          demotes; a host's replacement policy decides instead of the thresholds, and still cannot demote.
 * Boundary: test only; the listener is called directly with a stand-in account service and the threshold driver over
 *           `fakeSettings`, or a host policy, so no database or dispatcher runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0141; ADR 0454 (decision 3).
 */
import { fakeSettings } from "@stackra/settings/testing";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyTierPolicy } from "#contracts/ports/loyalty-tier-policy.port";
import type { TierDraft } from "#contracts/types/tier-draft.type";
import { ThresholdLoyaltyTierPolicyDriver } from "#node/drivers/threshold-loyalty-tier-policy.driver";
import { PointsEarned } from "#node/events/points-earned.event";
import { RecalculateTierListener } from "#node/listeners/recalculate-tier.listener";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";
import type { AccountService } from "#node/services/account.service";

/** A host's tier rules: whatever the balance, the member is silver. */
class AlwaysSilverPolicy extends LoyaltyTierPolicy {
  async tierFor(_draft: TierDraft): Promise<LoyaltyTier> {
    return LoyaltyTier.Silver;
  }
}

/** The listener over one account at `tier`; the threshold policy promotes at 500 (silver) and 1 500 (gold). */
function listenerFor(tier: LoyaltyTier, policy?: LoyaltyTierPolicy) {
  const account = Object.assign(new LoyaltyAccount(), { memberId: "usr_1", tier });
  const accounts = { findOneOrFail: async () => account } as unknown as AccountService;
  const thresholds = new ThresholdLoyaltyTierPolicyDriver(
    fakeSettings([
      [LoyaltyKitSettings, { expiryMonths: 12, tiers: { silverFrom: 500, goldFrom: 1_500 } }],
    ]),
  );
  return { account, listener: new RecalculateTierListener(accounts, policy ?? thresholds) };
}

/** A `points.earned` leaving `balanceAfter`. */
const earned = (balanceAfter: number) =>
  PointsEarned.create({
    memberId: "usr_1",
    points: 10,
    reference: "ord_1",
    tier: LoyaltyTier.Bronze,
    balanceAfter,
  });

const ctx = {
  eventId: "evt_1",
  occurredAt: new Date("2026-10-21T00:00:00Z"),
  now: () => new Date("2026-10-21T00:00:00Z"),
};

describe("RecalculateTierListener", () => {
  it("promotes to gold when balanceAfter reaches goldFrom, and to silver at silverFrom", async () => {
    const gold = listenerFor(LoyaltyTier.Bronze);
    await gold.listener.handle(earned(1_600), ctx);
    expect(gold.account.tier).toBe(LoyaltyTier.Gold);

    const silver = listenerFor(LoyaltyTier.Bronze);
    await silver.listener.handle(earned(500), ctx);
    expect(silver.account.tier).toBe(LoyaltyTier.Silver);
  });

  it("never demotes", async () => {
    const { account, listener } = listenerFor(LoyaltyTier.Gold);
    await listener.handle(earned(600), ctx);
    expect(account.tier).toBe(LoyaltyTier.Gold);
  });

  it("applies a host's replacement policy instead of the thresholds, still never demoting", async () => {
    const bronze = listenerFor(LoyaltyTier.Bronze, new AlwaysSilverPolicy());
    await bronze.listener.handle(earned(1_600), ctx);
    expect(bronze.account.tier).toBe(LoyaltyTier.Silver);

    const gold = listenerFor(LoyaltyTier.Gold, new AlwaysSilverPolicy());
    await gold.listener.handle(earned(10), ctx);
    expect(gold.account.tier).toBe(LoyaltyTier.Gold);
  });
});
