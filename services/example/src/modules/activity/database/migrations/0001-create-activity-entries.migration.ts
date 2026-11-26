/**
 * Stackra file contract:
 * Purpose: the first migration of the activity module: the `activity_entries` table of `ActivityEntry`, in the module's
 *          `activity` schema, with its tenant column and forced row-level policy.
 * Boundary: a frozen snapshot that uses only `@stackra/database`; every name is a literal. `belongsToTenant()` adds
 *           `tenant_id`, enables and forces row-level security and writes the equality policy; the index serves the
 *           feed (newest first) and the retention job (older than a cutoff), both within one tenant.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0239 (equality on `tenant_id`); ADR 0294.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the activity entries table. */
export class CreateActivityEntriesMigration extends Migration {
  /** Creates the table with its public id, tenant, timestamps, kind, note and time. */
  up(schema: SchemaBuilder): void {
    schema.create("activity_entries", (t: Blueprint) => {
      t.hasPublicId("act");
      t.belongsToTenant();
      t.timestamps();
      t.string("kind", 40)
        .notNull()
        .comment("What happened: note_created, note_updated or note_deleted.");
      t.string("note_id", 30).notNull().comment("The public id of the note it happened to.");
      t.timestamp("occurred_at").notNull().comment("When it happened (the event's time).");
      t.index(["tenant_id", "occurred_at"]);
    });
  }
}
