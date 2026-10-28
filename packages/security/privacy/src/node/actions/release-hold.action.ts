/**
 * Stackra file contract:
 * Purpose: `ReleaseHoldAction`, `privacy.hold.release@1`: releases a live legal hold of the Postgres hold store, so
 *          the records it held may be disposed of again.
 * Boundary: the row is kept, with the release time, actor and reason, as evidence; only a live hold of the session's
 *           tenant is released (`released: false` otherwise). Its permission `privacy.hold.release` is derived. Not an
 *           MCP tool: an agent never lifts a legal hold. The audit entry names the hold, not the reason text.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); ADR 0189 (decision 4); ADR 0294 (decisions 16 and 21);
 *                     data-layer gap gov20 (stackra-332).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import type { ReleaseHoldInput } from "#node/schemas/release-hold-input.schema";
import { ReleaseHoldOutput } from "#node/schemas/release-hold-output.schema";

/** The holds table. */
const HOLDS = '"privacy"."legal_holds"';

/** The session's partition, as the table's policy reads it. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/**
 * Releases a legal hold.
 *
 * @example
 * const { released } = await pipeline.execute(ReleaseHoldAction, { holdId, reason: "Matter closed" }, { actor });
 */
export class ReleaseHoldAction extends Action({
  key: "hold.release",
  actors: [ActorKind.User, ActorKind.Service],
  // reason: an agent never places or lifts a legal hold
  tool: false,
}) {
  /** The connected database; its entity manager is the action's transaction. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Marks the live hold released. */
  async handle(input: ReleaseHoldInput, ctx: ActionContext): Promise<ReleaseHoldOutput> {
    const rows = (await this.database.em().execute(
      // raw-sql: release keeps the row as evidence; only a live hold of the session's partition matches
      `update ${HOLDS} set released_at = ?, released_by = ?, release_reason = ? ` +
        `where id = ? and scope_id = ${PARTITION} and released_at is null returning id`,
      [ctx.now(), ctx.actor.id, input.reason, input.holdId],
    )) as readonly unknown[];
    const released = rows.length > 0;
    ctx.audit({ holdId: input.holdId, released });
    return ReleaseHoldOutput.create({ released });
  }
}
