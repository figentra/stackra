/**
 * Stackra file contract:
 * Purpose: `ThresholdLoyaltyTierPolicyDriver`, the kit's default `LoyaltyTierPolicy`: the tier whose threshold in
 *          `LoyaltyKitSettings.tiers` the balance after an earn has reached.
 * Boundary: implements the port only; its name is the file prefix (`threshold`), the port's one candidate in the kit,
 *           so no config field selects it, and a host replaces it with `@Replaces(LoyaltyTierPolicy)`. Reads the
 *           thresholds per call, so a changed setting applies at once. Answers only; never writes an account.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0213 (settings); ADR 0454 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { SettingsReader } from "@stackra/settings";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyTierPolicy } from "#contracts/ports/loyalty-tier-policy.port";
import type { TierDraft } from "#contracts/types/tier-draft.type";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";

/**
 * The balance thresholds an admin sets; the behaviour the kit had before the hook (ADR 0454).
 *
 * @example
 * await policy.tierFor({ memberId, current: LoyaltyTier.Bronze, balanceAfter: 1_600 }); // gold at goldFrom 1 500
 */
export class ThresholdLoyaltyTierPolicyDriver extends Driver(LoyaltyTierPolicy) {
  /** The tier thresholds. */
  private readonly settings: SettingsReader;

  /**
   * @param settings - the tier thresholds, read per call.
   */
  constructor(settings: SettingsReader) {
    super();
    this.settings = settings;
  }

  /** Gold at `goldFrom`, silver at `silverFrom`, else bronze. */
  async tierFor(draft: TierDraft): Promise<LoyaltyTier> {
    const { tiers } = await this.settings.get(LoyaltyKitSettings);
    if (draft.balanceAfter >= tiers.goldFrom) return LoyaltyTier.Gold;
    return draft.balanceAfter >= tiers.silverFrom ? LoyaltyTier.Silver : LoyaltyTier.Bronze;
  }
}
