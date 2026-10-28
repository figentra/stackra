/**
 * Stackra file contract:
 * Purpose: `PlaceHoldAction`, `privacy.hold.place@1`: places a legal hold on one record, or on a subject so every
 *          record linked to it is held, in the Postgres hold store that `PostgresHoldRegistryDriver` answers from.
 * Boundary: for a product outside Figentra OS (OS keeps holds in its compliance service). Called by a user or a
 *           service in a tenant session; the hold lands in that session's tenant partition. Its permission
 *           `privacy.hold.place` is derived; a product grants it to its compliance role. Not an MCP tool: an agent
 *           never places or lifts a legal hold. The audit entry names the hold and its target, not the reason text.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); ADR 0189 (decision 4); ADR 0294 (decisions 16 and 21);
 *                     data-layer gap gov20 (stackra-332).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, mintPublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import type { PlaceHoldInput } from "#node/schemas/place-hold-input.schema";
import { PlaceHoldOutput } from "#node/schemas/place-hold-output.schema";

/** The holds table. */
const HOLDS = '"privacy"."legal_holds"';

/** The session's partition, as the table's policy reads it. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/**
 * Places a legal hold.
 *
 * @example
 * const { holdId } = await pipeline.execute(PlaceHoldAction, { model: "Invoice", recordId, reason: "Matter 2026-14" }, { actor });
 */
export class PlaceHoldAction extends Action({
  key: "hold.place",
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

  /** Stores the hold and answers with its id. */
  async handle(input: PlaceHoldInput, ctx: ActionContext): Promise<PlaceHoldOutput> {
    const at = ctx.now();
    const holdId = mintPublicId("lgh", at.getTime());
    // raw-sql: the hold store is this package's own table; every value is bound
    await this.database
      .em()
      .execute(
        `insert into ${HOLDS} (id, scope_id, model, record_id, reason, placed_by, placed_at) ` +
          `values (?, ${PARTITION}, ?, ?, ?, ?, ?)`,
        [holdId, input.model, input.recordId, input.reason, ctx.actor.id, at],
      );
    ctx.audit({ holdId, model: input.model, recordId: input.recordId });
    return PlaceHoldOutput.create({ holdId });
  }
}
