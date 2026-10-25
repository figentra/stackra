/**
 * Stackra file contract:
 * Purpose: `RecalculateTierListener`, promotes an account when the balance after an earn crosses a tier threshold.
 * Boundary: subscribed to the kit's own `loyalty_kit.points.earned` by the type of the event parameter; runs after
 *           commit, in its own transaction, once per event id. Idempotent: it only ever raises a tier, so a redelivery
 *           or a lower balance changes nothing. One listener is one reaction with one `handle`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 16); ADR 0078 (decision 4: listener semantics); ADR 0305 (rule 20).
 */
import { Enum } from "@stackra/contracts";
import { Listener, type ListenerContext } from "@stackra/events";
import type { SettingsReader } from "@stackra/settings";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { PointsEarned } from "#node/events/points-earned.event";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import type { AccountService } from "#node/services/account.service";

/**
 * Reads the v2 payload's `balanceAfter`, which is why the event gained a version.
 *
 * @example
 * await listener.handle(PointsEarned.create({ memberId, points, reference, tier, balanceAfter: 1_600 }), ctx);
 */
export class RecalculateTierListener extends Listener {
  /** Loads the account to promote. */
  private readonly accounts: AccountService;

  /** The tier thresholds, read per event so a change applies at once. */
  private readonly settings: SettingsReader;

  /**
   * @param accounts - loads the account to promote.
   * @param settings - the tier thresholds, read per event so a change applies at once.
   */
  constructor(accounts: AccountService, settings: SettingsReader) {
    super();
    this.accounts = accounts;
    this.settings = settings;
  }

  /** Promotion only; demotion is an admin decision made in the console, never automatic. */
  async handle(event: PointsEarned, _ctx: ListenerContext): Promise<void> {
    const { tiers } = await this.settings.get(LoyaltyKitSettings);
    const target =
      event.balanceAfter >= tiers.goldFrom
        ? LoyaltyTier.Gold
        : event.balanceAfter >= tiers.silverFrom
          ? LoyaltyTier.Silver
          : LoyaltyTier.Bronze;
    const account = await this.accounts.findOneOrFail({ memberId: event.memberId });
    const ranks = Enum.values(LoyaltyTier); // lowest first
    if (ranks.indexOf(target) > ranks.indexOf(account.tier)) account.tier = target;
  }
}
