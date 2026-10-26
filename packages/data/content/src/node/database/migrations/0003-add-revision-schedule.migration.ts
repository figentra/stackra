/**
 * Stackra file contract:
 * Purpose: the schedule columns of `content.revisions` for `Schedulable`: when a revision goes live and the campaign
 *          that groups it, with the index `publishDue` reads.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Expand-only: both columns are nullable, and the index builds concurrently. No `down()`: gen
 *           derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0321 (decision 6); ADR 0159 (as amended: expand-only adds, online indexes).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the schedule columns. */
export class AddRevisionScheduleMigration extends Migration {
  /** The two columns and their index. */
  up(schema: SchemaBuilder): void {
    schema.table("revisions", (t: Blueprint) => {
      t.timestamp("scheduled_at")
        .nullable()
        .comment("When the revision goes live; null unless scheduled.");
      t.string("campaign", 64)
        .nullable()
        .comment("The campaign key that groups scheduled revisions; null for none.");
      t.index(["scheduled_at"]).concurrently();
    });
  }
}
