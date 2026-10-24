/**
 * Stackra file contract:
 * Purpose: the first migration of the queue package (`queue.0001_create_jobs`): the `queue.jobs` table the Postgres
 *          driver keeps jobs in, with the index a reservation scans and the partial unique index that queues a unique
 *          job once while it waits or runs.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It lives in the package's own schema (`queue`), which gen creates first. The table is the
 *           platform's job store, read by workers across scopes, so it has no row-level-security policy; a job's scope
 *           is data (`scope_id`, `scope_path`) the worker opens as the session of each attempt. No `down()`: gen
 *           derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0148 (decisions 1 and 3); R-16 (every column has a comment and its
 *                     nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the job table. */
export class CreateJobsMigration extends Migration {
  /** The table with its indexes. */
  up(schema: SchemaBuilder): void {
    schema.create("jobs", (t: Blueprint) => {
      t.hasPublicId("job");
      t.timestamps();
      t.string("queue", 63).notNull().comment("The worker queue the job runs on.");
      t.string("job_key", 200).notNull().comment("The key of the action the job runs.");
      t.jsonb("input").notNull().comment("The action's input, as JSON.");
      t.jsonb("origin").nullable().comment("The actor whose call queued the job.");
      t.string("scope_id", 33)
        .nullable()
        .comment("The public id of the scope node the job runs in.");
      t.string("scope_path")
        .nullable()
        .comment("The materialised path of the scope node the job runs in.");
      t.string("idempotency_key", 255).nullable().comment("The Idempotency-Key of a queued call.");
      t.string("unique_key").nullable().comment("Held while a unique job waits or runs.");
      t.string("caused_by", 64).nullable().comment("The id of the call that queued the job.");
      t.enum("status", ["waiting", "running", "dead"]).notNull().comment("Where the job is.");
      t.integer("attempts").notNull().default(0).comment("Attempts started so far.");
      t.timestamp("run_at").notNull().comment("When the job is due.");
      t.timestamp("locked_until").nullable().comment("When a running job's reservation lapses.");
      t.string("lease", 32)
        .notNull()
        .comment("How long a reservation holds, as an ISO 8601 duration.");
      t.jsonb("last_error").nullable().comment("The code and message of the last failed attempt.");
      t.index(["status", "queue", "run_at"]);
      t.unique(["unique_key"]).where("status in ('waiting', 'running')");
    });
  }
}
