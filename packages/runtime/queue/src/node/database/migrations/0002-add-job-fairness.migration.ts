/**
 * Stackra file contract:
 * Purpose: the second migration of the queue package (`queue.0002_add_job_fairness`): the fairness columns of
 *          `queue.jobs` (priority, the per-scope running cap, the throttle, the batch and the rest of a chain), the
 *          index the fair reservation counts running jobs by, and the `queue.job_batches` table that keeps batch
 *          progress.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Expand-only: every new column is nullable or has a default, and the index builds concurrently.
 *           The batch table is the platform's, read by workers across scopes, so it has no row-level-security policy,
 *           like `queue.jobs`. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: expand-only adds, online indexes); ADR 0148 (decisions 1 and 2); R-16
 *                     (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the fairness columns and the batch table. */
export class AddJobFairnessMigration extends Migration {
  /** The columns, their index and the batch table. */
  up(schema: SchemaBuilder): void {
    schema.table("jobs", (t: Blueprint) => {
      t.integer("priority")
        .notNull()
        .default(0)
        .comment("Higher runs first among due jobs of a queue.");
      t.integer("scope_concurrency")
        .nullable()
        .comment("The most jobs of the queue and scope that run at once; null for no cap.");
      t.jsonb("throttle")
        .nullable()
        .comment("The throttle bucket key and attempts a minute; null when not throttled.");
      t.string("batch_id", 30).nullable().comment("The batch the job was queued in.");
      t.jsonb("chain").nullable().comment("The links queued after the job is done, in order.");
      t.index(["queue", "scope_id", "status"]).concurrently();
    });
    schema.create("job_batches", (t: Blueprint) => {
      t.hasPublicId("jbt");
      t.timestamps();
      t.integer("total").notNull().comment("Jobs queued in the batch.");
      t.integer("done").notNull().default(0).comment("Jobs of the batch that finished.");
      t.integer("failed").notNull().default(0).comment("Jobs of the batch that failed for good.");
    });
  }
}
