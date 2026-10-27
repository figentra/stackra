/**
 * Stackra file contract:
 * Purpose: `RecalculateTierListener`, promotes an account after an earn to the tier the `LoyaltyTierPolicy` port
 *          answers (the balance thresholds by default, a host's own tier rules when it replaces the policy).
 * Boundary: subscribed to the kit's own `loyalty_kit.points.earned` by the type of the event parameter; runs after
 *           commit, in its own transaction, once per event id. Idempotent: it only ever raises a tier, so a redelivery,
 *           a lower balance or a policy answering lower changes nothing. The rule is the policy's; this file applies
 *           it. One listener is one reaction with one `handle`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 16); ADR 0078 (decision 4: listener semantics); ADR 0305 (rule 20);
 *                     ADR 0454 (decision 3: the tier hook).
 */
import { Enum } from "@stackra/contracts";
import { Listener, type ListenerContext } from "@stackra/events";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { LoyaltyTierPolicy } from "#contracts/ports/loyalty-tier-policy.port";
import { memberId } from "#core/functions/member-id.function";
import type { PointsEarned } from "#node/events/points-earned.event";
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

  /** Decides the tier; the threshold driver unless the host replaced it. */
  private readonly policy: LoyaltyTierPolicy;

  /**
   * @param accounts - loads the account to promote.
   * @param policy - decides the tier the earn earns.
   */
  constructor(accounts: AccountService, policy: LoyaltyTierPolicy) {
    super();
    this.accounts = accounts;
    this.policy = policy;
  }

  /** Promotion only; demotion is an admin decision made in the console, never automatic. */
  async handle(event: PointsEarned, _ctx: ListenerContext): Promise<void> {
    const account = await this.accounts.findOneOrFail({ memberId: event.memberId });
    const target = await this.policy.tierFor({
      memberId: memberId(event.memberId),
      current: account.tier,
      balanceAfter: event.balanceAfter,
    });
    const ranks = Enum.values(LoyaltyTier); // lowest first
    if (ranks.indexOf(target) > ranks.indexOf(account.tier)) account.tier = target;
  }
}
