/**
 * Stackra file contract:
 * Purpose: `PostgresSnapshotStoreDriver`, the durable `SnapshotStore` (driver name `postgres`): the latest state of each
 *          co-edited document is one row of `collaboration.snapshots`, replaced on every save.
 * Boundary: raw SQL on the running context's entity manager, every value bound and every row read through zod. Rows
 *           are isolated by the room's scope: a save never replaces another scope's row for the same document id, and
 *           a read answers only the room's own scope. A failing statement rejects, so a lost save is never reported as
 *           done (the port's rule).
 * Runtime: node
 * Governing contract: ADR 0225 (decision 2); ADR 0270 (decisions 2 and 5); ADR 0160 (raw SQL is parameterised and
 *                     typed with zod); ADR 0142 (drivers behind ports).
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { SnapshotStore } from "#contracts/index";
import type { CollaborationRoom, DocumentSnapshot } from "#contracts/index";

/** The table, in the package's schema. */
const TABLE = "collaboration.snapshots";

/** Rows of a read. */
const ROWS = z.array(z.object({ state: z.instanceof(Uint8Array), saved_at: z.coerce.date() }));

/**
 * Snapshots in Postgres.
 *
 * @example
 * // generated wiring: { port: SnapshotStore, candidates: { postgres: … } }
 */
export class PostgresSnapshotStoreDriver extends Driver(SnapshotStore) {
  private readonly database: Database;

  /** @param database - the connected database whose running transaction each statement joins. */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** See `SnapshotStore.save`. */
  async save(room: CollaborationRoom, snapshot: DocumentSnapshot): Promise<void> {
    // raw-sql: an upsert that only replaces the row of the room's own scope, which the ORM cannot express
    await this.database
      .em()
      .execute(
        `insert into ${TABLE} as current (document, scope_id, state, saved_at) values (?, ?, ?, ?) ` +
          "on conflict (document) do update set state = excluded.state, saved_at = excluded.saved_at " +
          "where current.scope_id is not distinct from excluded.scope_id",
        [room.document, room.scope?.id ?? null, Buffer.from(snapshot.state), snapshot.savedAt],
      );
  }

  /** See `SnapshotStore.latest`. */
  async latest(room: CollaborationRoom): Promise<DocumentSnapshot | undefined> {
    // raw-sql: the table has no model; one read by key and scope
    const rows = await this.database
      .em()
      .execute(
        `select state, saved_at from ${TABLE} where document = ? and scope_id is not distinct from ?`,
        [room.document, room.scope?.id ?? null],
      );
    const [row] = ROWS.parse(rows);
    return row === undefined
      ? undefined
      : { state: new Uint8Array(row.state), savedAt: row.saved_at };
  }
}
