/**
 * Stackra file contract:
 * Purpose: `ExpirePointsAction`, `loyalty_kit.points.expire@1`: the job that expires points older than the window the
 *          settings hold.
 * Boundary: a job is an action run from a queue; its `job` surface names the cron schedule that dispatches it once per
 *           scope (`perScope`), and gen checks the cron's `input` against `ExpirePointsInput`.
 *           The only actor is the system, so it gets no endpoint and no tool, and the same pipeline applies isolation,
 *           audit and idempotency. Each driver cuts an expiry at zero, so a member whose earned points were spent is
 *           never taken below zero. Each account whose expiry took points records `loyalty_kit.points.expired.v1`,
 *           which reaches the outbox with the run's unit of work. It runs on the default queue until gen writes
 *           `#stackra/queues` (`Queues.Maintenance`). The key's aggregate (`points`) is not the model's, so the permission is named:
 *           `LoyaltyAccountPermissions.expire`, a system permission no role grants.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16, 18 and 21); ADR 0305 (rule 28: the job surface); ADR 0098; ADR 0148
 *                     (queue and scheduler); ADR 0220; ADR 0454 (decision 4).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, SortDirection } from "@stackra/contracts";
import type { SettingsReader } from "@stackra/settings";

import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { PointsExpired } from "#node/events/points-expired.event";
import { LoyaltyKitSettings } from "#node/loyalty-kit.settings";
import type { ExpirePointsInput } from "#node/schemas/expire-points-input.schema";
import { ExpirePointsOutput } from "#node/schemas/expire-points-output.schema";
import type { AccountService } from "#node/services/account.service";

/**
 * `unique: true`: one run per scope at a time; an overlapping tick is skipped, not queued twice.
 *
 * @example
 * const { accounts, points } = await pipeline.execute(ExpirePointsAction, { batchSize: 500 }, { actor: system });
 */
export class ExpirePointsAction extends Action({
  key: "points.expire",
  permission: LoyaltyAccountPermissions.expire,
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "5m",
    retries: 3,
    cron: { schedule: "0 3 * * *", perScope: true, input: { batchSize: 500 } },
  },
}) {
  /** Lists the accounts to visit. */
  private readonly accounts: AccountService;

  /** The configured ledger driver. */
  private readonly ledger: LoyaltyLedger;

  /** The expiry window, read at run time so a changed setting applies on the next tick. */
  private readonly settings: SettingsReader;

  /**
   * @param accounts - lists the accounts to visit.
   * @param ledger - the configured ledger driver.
   * @param settings - the expiry window, read at run time.
   */
  constructor(accounts: AccountService, ledger: LoyaltyLedger, settings: SettingsReader) {
    super();
    this.accounts = accounts;
    this.ledger = ledger;
    this.settings = settings;
  }

  /** Visits active accounts oldest-updated first; `ctx.now()` is the frozen pipeline clock, so a test pins the cutoff. */
  async handle(input: ExpirePointsInput, ctx: ActionContext): Promise<ExpirePointsOutput> {
    const { expiryMonths } = await this.settings.get(LoyaltyKitSettings);
    const cutoff = new Date(ctx.now());
    cutoff.setUTCMonth(cutoff.getUTCMonth() - expiryMonths);
    const accounts = await this.accounts.find(
      { isFrozen: false },
      { limit: input.batchSize, orderBy: { updatedAt: SortDirection.Asc } },
    );
    let points = 0;
    for (const account of accounts) {
      const member = memberId(account.memberId);
      // oxlint-disable-next-line no-await-in-loop -- one account at a time on the caller's connection
      const expired = await this.ledger.expire(member, cutoff);
      if (expired <= 0) continue;
      points += expired;
      account.record(
        PointsExpired.create({
          memberId: account.memberId,
          points: expired,
          cutoff: cutoff.toISOString(),
          // oxlint-disable-next-line no-await-in-loop -- read on the same connection, after this member's expiry
          balanceAfter: await this.ledger.balance(member),
        }),
      );
    }
    return ExpirePointsOutput.create({ accounts: accounts.length, points });
  }
}
