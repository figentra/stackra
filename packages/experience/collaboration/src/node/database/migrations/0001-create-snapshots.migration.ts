/**
 * Stackra file contract:
 * Purpose: the first migration of the collaboration package (`collaboration.0001_create_snapshots`): the latest saved
 *          state of each co-edited document, with the scope it belongs to.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every statement is a
 *           literal with its inverse. Raw DDL because the blueprint has no binary column; the state is opaque CRDT
 *           bytes. One row per document (the latest state is enough: versions and history are the content type's,
 *           ADR 0270 decision 2). No row-level security: the driver binds the room's scope on every read and write.
 * Runtime: node
 * Governing contract: ADR 0225 (decision 2: state saved as snapshots); ADR 0346 (decision 4); ADR 0159 (as amended).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the snapshot table. */
export class CreateSnapshotsMigration extends Migration {
  /** The table, with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql(
      "create table collaboration.snapshots (" +
        "document varchar(64) primary key, " +
        "scope_id varchar(64), " +
        "state bytea not null, " +
        "saved_at timestamptz not null)",
      { inverse: "drop table if exists collaboration.snapshots" },
    );
  }
}
