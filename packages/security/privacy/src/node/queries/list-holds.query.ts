/**
 * Stackra file contract:
 * Purpose: `ListHoldsQuery`, `privacy.hold.list@1`: the session tenant's legal holds from the Postgres hold store,
 *          live ones by default, optionally only those on one record or subject, newest first.
 * Boundary: read only. Its permission `privacy.hold.list` is derived. Not an MCP tool, like placing and releasing.
 *           shortcut: at most 500 holds, unpaged; page it when a tenant keeps more.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); ADR 0294 (decisions 16 and 21); data-layer gap gov20
 *                     (stackra-332).
 */
import { Query } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import type { ListHoldsInput } from "#node/schemas/list-holds-input.schema";
import { ListHoldsOutput } from "#node/schemas/list-holds-output.schema";

/** The holds table. */
const HOLDS = '"privacy"."legal_holds"';

/** The session's partition, as the table's policy reads it. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/** A selected hold row. */
type HoldRow = {
  readonly id: string;
  readonly model: string;
  readonly record_id: string;
  readonly reason: string;
  readonly placed_by: string | null;
  readonly placed_at: Date;
  readonly released_at: Date | null;
};

/**
 * Lists legal holds.
 *
 * @example
 * const { holds } = await pipeline.execute(ListHoldsQuery, { recordId: "cus_01…" }, { actor });
 */
export class ListHoldsQuery extends Query({
  key: "hold.list",
  actors: [ActorKind.User, ActorKind.Service],
  // reason: legal holds are a compliance officer's surface, not an agent's
  tool: false,
}) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** The matching holds, newest first. */
  async handle(input: ListHoldsInput): Promise<ListHoldsOutput> {
    const conditions = [`scope_id = ${PARTITION}`];
    const params: unknown[] = [];
    if (input.includeReleased !== true) conditions.push("released_at is null");
    if (input.recordId !== undefined) {
      conditions.push("record_id = ?");
      params.push(input.recordId);
    }
    const rows = (await this.database.em().execute(
      // raw-sql: the hold store is this package's own table; the conditions are literals and the values bound
      `select id, model, record_id, reason, placed_by, placed_at, released_at from ${HOLDS} ` +
        `where ${conditions.join(" and ")} order by placed_at desc limit 500`,
      params,
    )) as readonly HoldRow[];
    return ListHoldsOutput.create({
      holds: rows.map((row) => ({
        id: row.id,
        model: row.model,
        recordId: row.record_id,
        reason: row.reason,
        placedBy: row.placed_by,
        placedAt: new Date(row.placed_at).toISOString(),
        releasedAt: row.released_at === null ? null : new Date(row.released_at).toISOString(),
      })),
    });
  }
}
