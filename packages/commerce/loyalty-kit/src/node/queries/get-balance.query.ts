/**
 * Stackra file contract:
 * Purpose: `GetBalanceQuery`, `loyalty_kit.points.balance@1`: an account's balance, tier and next expiry; also an MCP
 *          tool (queries are by default).
 * Boundary: read only, no transaction. Cached for one minute per principal and input and dropped the moment points
 *           move (`invalidateOn` takes the event classes). The record check runs through `ctx.authorize(account)`.
 *           The next expiry is read from the member's own entries (the oldest earn not yet expired, plus the window),
 *           not from the account's `entries` relation, which journal rows do not fill until the backfill. `intent:
 *           true` takes its phrases from `loyalty_kit::actions.points.balance.intents`. The sample's path is kept. The key's
 *           aggregate (`points`) is not the model's, so the permission is named (`LoyaltyAccountPermissions.read`, L0),
 *           and `LoyaltyAccountPolicy#read` narrows a customer to their own account.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 16 and 21); ADR 0305 (rules 28 and 31 to 33: the cache option); ADR
 *                     0150; ADR 0155; ADR 0245; ADR 0454 (decision 4: an expiry drops the cache too).
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind, HttpMethod, SortDirection } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import type { SettingsReader } from "@stackra/settings";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { EXPIRE_REFERENCE_PREFIX } from "#core/constants/expire-reference-prefix.constant";
import { memberId } from "#core/functions/member-id.function";
import { BalanceView } from "#core/schemas/balance-view.schema";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { PointsEarned } from "#node/events/points-earned.event";
import { PointsExpired } from "#node/events/points-expired.event";
import { PointsRedeemed } from "#node/events/points-redeemed.event";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import type { LedgerEntry } from "#node/models/ledger-entry.model";
import type { GetBalanceInput } from "#node/schemas/get-balance-input.schema";
import type { AccountService } from "#node/services/account.service";

/**
 * Returns the caller's (or, for staff, any member's) points balance, tier and the date the oldest live points expire.
 *
 * @example
 * const { balance, nextExpiryAt } = await pipeline.execute(GetBalanceQuery, { accountId }, { actor });
 */
export class GetBalanceQuery extends Query({
  key: "points.balance",
  permission: LoyaltyAccountPermissions.read,
  actors: [ActorKind.User, ActorKind.Agent, ActorKind.Service],
  endpoint: { method: HttpMethod.Get, path: "/loyalty/accounts/:accountId/balance" },
  intent: true,
  cache: { ttl: "1m", invalidateOn: [PointsEarned, PointsRedeemed, PointsExpired] },
}) {
  /** Loads the account for the record check. */
  private readonly accounts: AccountService;

  /** The configured ledger driver; the balance is its sum. */
  private readonly ledger: LoyaltyLedger;

  /** The member's earn and expiry rows, for the next expiry. */
  private readonly entries: Repository<LedgerEntry>;

  /** The expiry window. */
  private readonly settings: SettingsReader;

  /**
   * @param accounts - loads the account for the record check.
   * @param ledger - the configured ledger driver.
   * @param entries - the ledger entry rows.
   * @param settings - the expiry window.
   */
  constructor(
    accounts: AccountService,
    ledger: LoyaltyLedger,
    entries: Repository<LedgerEntry>,
    settings: SettingsReader,
  ) {
    super();
    this.accounts = accounts;
    this.ledger = ledger;
    this.entries = entries;
    this.settings = settings;
  }

  /**
   * Loads the account first so the record check can see it; the balance is read after authorization passes.
   *
   * @throws NotFoundError when the account does not exist in the caller's scope; a `forbidden` refusal when the record
   *         check denies.
   */
  async handle(input: GetBalanceInput, ctx: QueryContext): Promise<BalanceView> {
    const account = await this.accounts.findOneOrFail({ id: input.accountId });
    await ctx.authorize(account);
    const { expiryMonths } = await this.settings.get(LoyaltyKitSettings);
    const rows = await this.entries.find(
      { memberId: account.memberId, kind: { $in: [EntryKind.Earn, EntryKind.Expire] } },
      { orderBy: { at: SortDirection.Asc } },
    );
    const expired = new Set(
      rows.filter((row) => row.kind === EntryKind.Expire).map((row) => row.reference),
    );
    const oldestEarn = rows.find(
      (row) =>
        row.kind === EntryKind.Earn && !expired.has(`${EXPIRE_REFERENCE_PREFIX}${row.reference}`),
    );
    let nextExpiryAt: Date | null = null;
    if (oldestEarn !== undefined) {
      nextExpiryAt = new Date(oldestEarn.at.getTime());
      nextExpiryAt.setUTCMonth(nextExpiryAt.getUTCMonth() + expiryMonths);
    }
    return BalanceView.create({
      memberId: account.memberId,
      tier: account.tier,
      balance: await this.ledger.balance(memberId(account.memberId)),
      nextExpiryAt,
    });
  }
}
