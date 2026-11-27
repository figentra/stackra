/**
 * Stackra file contract:
 * Purpose: the ninth migration of the database package (`database.0009_create_backfill_runs`): the backfill ledger
 *          behind `runBackfill`, one row per backfill key holding its keyset cursor, the rows and batches it filled,
 *          when it last reached the end and the code of its last failure, so a run resumes where the last one stopped.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. A backfill walks every tenant's rows, so its progress is no tenant's: a platform table.
 *           `last_error` holds a SQLSTATE or error class, never a message, which can quote row values. No `down()`:
 *           gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs, resumable); ADR 0334 (rule 4); ADR 0239
 *                     (2026-11-07 amendment, group (c): platform tables).
 */
import { Migration, type Blueprint, type SchemaBuilder } from "@stackra/database";

/** Creates the backfill ledger. */
export class CreateBackfillRunsMigration extends Migration {
  /** One table keyed by the backfill's key. */
  up(schema: SchemaBuilder): void {
    schema.create("backfill_runs", (t: Blueprint) => {
      t.platformTable(
        "one row per backfill key: a platform job's progress over every tenant's rows",
      );
      t.string("key", 127).notNull().comment("The backfill's key, <module>.<name> (Backfill).");
      t.string("last_key")
        .nullable()
        .comment("The keyset value of the last row a committed batch reached; null before one.");
      t.bigint("rows_done").notNull().default(0).comment("Rows filled across every run.");
      t.integer("batches").notNull().default(0).comment("Batches committed across every run.");
      t.timestamp("finished_at")
        .nullable()
        .comment("When a batch last found no pending row past the cursor; null while rows remain.");
      t.string("last_error", 63)
        .nullable()
        .comment("The SQLSTATE or error class of the last failed batch; null after one commits.");
      t.timestamps();
      t.primary(["key"]);
    });
  }
}
