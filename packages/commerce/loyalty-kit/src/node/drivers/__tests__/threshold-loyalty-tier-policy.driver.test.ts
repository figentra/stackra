/**
 * Stackra file contract:
 * Purpose: unit tests of `ThresholdLoyaltyTierPolicyDriver`: the balance after an earn maps to gold at `goldFrom`,
 *          silver at `silverFrom` and bronze below, from the settings.
 * Boundary: test only; the thresholds come from `fakeSettings`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0454 (decision 3).
 */
import { fakeSettings } from "@stackra/settings/testing";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyTierPolicy } from "#contracts/ports/loyalty-tier-policy.port";
import { memberId } from "#core/functions/member-id.function";
import { ThresholdLoyaltyTierPolicyDriver } from "#node/drivers/threshold-loyalty-tier-policy.driver";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";

/** A bronze member's earn leaving `balanceAfter`. */
const draft = (balanceAfter: number) => ({
  memberId: memberId("usr_1"),
  current: LoyaltyTier.Bronze,
  balanceAfter,
});

describe("ThresholdLoyaltyTierPolicyDriver", () => {
  const policy = new ThresholdLoyaltyTierPolicyDriver(
    fakeSettings([[LoyaltyKitSettings, { tiers: { silverFrom: 500, goldFrom: 1_500 } }]]),
  );

  it("is a LoyaltyTierPolicy driver", () => {
    expect(policy).toBeInstanceOf(LoyaltyTierPolicy);
  });

  it("maps the balance to the tier whose threshold it reached", async () => {
    expect(await policy.tierFor(draft(1_500))).toBe(LoyaltyTier.Gold);
    expect(await policy.tierFor(draft(500))).toBe(LoyaltyTier.Silver);
    expect(await policy.tierFor(draft(499))).toBe(LoyaltyTier.Bronze);
  });
});
