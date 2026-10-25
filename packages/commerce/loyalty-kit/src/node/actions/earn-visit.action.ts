/**
 * Stackra file contract:
 * Purpose: `EarnVisitAction`, `loyalty_kit.points.earn_visit@1`: earning by visit count (a stamp card). A till or a
 *          booking service stamps a member's card for a visit; the stamp count and the card size are the
 *          `stampsPerVisit` and `stampsPerCard` settings, so a tenant changes its card without a deploy.
 * Boundary: the action is the contract; `AccountService.earnVisit` does the work (enroll on first use, frozen check,
 *           one ledger entry per visit reference, `points.earned`). Staff and services only: a customer never stamps
 *           their own card, so no customer role holds `LoyaltyAccountPermissions.stamp`. Which visits earn a stamp is
 *           the host's earn rule set; this action stamps what it is given.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 3, 16 and 21); ADR 0098; the PUT-133, COM-181 and COM-183 answers;
 *                     config-model section 4 (earn rules are a rule set).
 */
import { Action } from "@stackra/actions";
import { ActorKind, HttpMethod } from "@stackra/contracts";
import type { SettingsReader } from "@stackra/settings";

import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { memberId } from "#core/functions/member-id.function";
import { stampCardProgress } from "#core/functions/stamp-card-progress.function";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import type { EarnVisitInput } from "#node/schemas/earn-visit-input.schema";
import { EarnVisitOutput } from "#node/schemas/earn-visit-output.schema";
import type { AccountService } from "#node/services/account.service";

/**
 * Stamps a member's card for one visit; a repeated visit reference stamps nothing.
 *
 * @example
 * await pipeline.execute(EarnVisitAction, { principalId: "usr_1", reference: "apt_42" }, { actor: service });
 */
export class EarnVisitAction extends Action({
  key: "points.earn_visit",
  permission: LoyaltyAccountPermissions.stamp,
  actors: [ActorKind.User, ActorKind.Service],
  endpoint: { method: HttpMethod.Post, path: "/loyalty/visits" },
}) {
  /** Credits the stamps. */
  private readonly accounts: AccountService;

  /** The configured ledger driver, for the card after the stamp. */
  private readonly ledger: LoyaltyLedger;

  /** The stamp settings, read at run time. */
  private readonly settings: SettingsReader;

  /**
   * @param accounts - credits the stamps.
   * @param ledger - the configured ledger driver.
   * @param settings - the stamp settings.
   */
  constructor(accounts: AccountService, ledger: LoyaltyLedger, settings: SettingsReader) {
    super();
    this.accounts = accounts;
    this.ledger = ledger;
    this.settings = settings;
  }

  /**
   * Stamps the visit and answers the card.
   *
   * @throws AccountFrozenError when the member's account is frozen.
   */
  async handle(input: EarnVisitInput): Promise<EarnVisitOutput> {
    const { stampsPerVisit, stampsPerCard } = await this.settings.get(LoyaltyKitSettings);
    const member = memberId(input.principalId);
    const stamps = await this.accounts.earnVisit(member, {
      reference: input.reference,
      stamps: stampsPerVisit,
    });
    const card = stampCardProgress(await this.ledger.balance(member), stampsPerCard);
    return EarnVisitOutput.create({
      stamps,
      onCard: card.stamps,
      perCard: card.perCard,
      fullCards: card.fullCards,
    });
  }
}
