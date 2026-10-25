/**
 * Stackra file contract:
 * Purpose: `PointsIssuedQuery`, `loyalty_kit.points.stats_today@1`: points earned and redeemed today, for the dashboard
 *          renderer.
 * Boundary: read only; aggregates in SQL through the ledger entry repository, within the caller's scope session. Only
 *           the `User` actor may call it (scope-wide numbers are not for customers). It keeps no HTTP route
 *           (`endpoint: false`); it is still an MCP tool. Cached five minutes per principal and dropped when points
 *           move. It runs under `LoyaltyAccountPermissions.read` (L0), named because the key's aggregate is `points`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 16 and 21); ADR 0305 (rules 28 and 31 to 33); ADR 0098; ADR 0155.
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Repository } from "@stackra/database";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { PointsIssuedView } from "#core/schemas/points-issued-view.schema";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import { PointsEarned } from "#node/events/points-earned.event";
import { PointsRedeemed } from "#node/events/points-redeemed.event";
import type { LedgerEntry } from "#node/models/ledger-entry.model";
import type { PointsIssuedInput } from "#node/schemas/points-issued-input.schema";

/**
 * Two sums over today's rows.
 *
 * @example
 * const { earned, redeemed } = await pipeline.execute(PointsIssuedQuery, {}, { actor: staff });
 */
export class PointsIssuedQuery extends Query({
  key: "points.stats_today",
  permission: LoyaltyAccountPermissions.read,
  actors: [ActorKind.User],
  endpoint: false,
  cache: { ttl: "5m", invalidateOn: [PointsEarned, PointsRedeemed] },
}) {
  /** The ledger entry repository; `sum` runs in SQL. */
  private readonly rows: Repository<LedgerEntry>;

  /** @param rows - the ledger entry repository. */
  constructor(rows: Repository<LedgerEntry>) {
    super();
    this.rows = rows;
  }

  /** `ctx.startOfDay()` applies the call's time zone. */
  async handle(_input: PointsIssuedInput, ctx: QueryContext): Promise<PointsIssuedView> {
    const since = ctx.startOfDay();
    const [earned, redeemed] = await Promise.all([
      this.rows.sum("points", { kind: EntryKind.Earn, at: { $gte: since } }),
      this.rows.sum("points", { kind: EntryKind.Redeem, at: { $gte: since } }),
    ]);
    return PointsIssuedView.create({ earned, redeemed: -redeemed || 0 });
  }
}
