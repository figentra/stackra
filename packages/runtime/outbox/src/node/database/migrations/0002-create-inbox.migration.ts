/**
 * Stackra file contract:
 * Purpose: the second migration of the outbox package (`outbox.0002_create_inbox`): the `outbox.inbox` table of the
 *          event ids this service has received and run, keyed by id, with the index the retention purge reads.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Event ids are unique per occurrence, so the table carries no scope and no row-level-security
 *           policy (data review: an id names no record and holds no customer data). No `down()`: gen derives the dev
 *           inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0078 (decision 4: inbox deduplication by event id); R-16.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the inbox table. */
export class CreateInboxMigration extends Migration {
  /** The table with its key and index. */
  up(schema: SchemaBuilder): void {
    schema.create("inbox", (t: Blueprint) => {
      t.string("event_id", 64)
        .notNull()
        .comment("The id of an event this service has received and run.");
      t.timestamp("received_at")
        .notNull()
        .comment("When it was received; the retention purge reads it.");
      t.primary(["event_id"]);
      t.index(["received_at"]);
    });
  }
}
