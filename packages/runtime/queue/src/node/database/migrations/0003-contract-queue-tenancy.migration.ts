/**
 * Stackra file contract:
 * Purpose: the third migration of the queue package (`queue.0003_contract_queue_tenancy`): makes `queue.jobs`
 *          tenant-owned in the platform form (ADR 0239 amendment, gap C) and gives the worker and the operator their
 *          system functions (gap A). The table gets `tenant_id` (nullable, filled from `app.tenant_id` by default, so a
 *          job takes the tenant of the call that queued it and never one from input; a NULL row is the platform's) and
 *          the one permissive policy `pol_jobs_tenant_id` with the restrictive `_write_update` and `_write_delete`. The
 *          worker leases a due job through `queue.reserve_job` (the lease columns only) and loads and settles it in
 *          its owner's isolation; the operator claims dead letters through `queue.claim_dead_jobs`; a redrive asks
 *          `queue.unique_key_holders` whether a live job of any owner holds the same unique key. `queue.job_batches`
 *          stays a platform table (batch counters only).
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the online owner index runs in one transaction: the column, the backfill, the
 *           pre-flight, then the policies and system access in one blueprint, then the functions. The backfill reads
 *           only the row: tenants are recursive, so only a scope at depth 3 (`platform.<product>.<tenant>`) is
 *           certainly a tenant, whose `scope_id` becomes the job's owner; a job with no scope or at the root or a
 *           product node stays a platform job. `scope_path` is text here, so its depth is its count of labels. A job
 *           deeper than a tenant node is refused, naming the count and the remedy, so a refusal changes nothing. The
 *           unique index on `unique_key` stays global (an index, not a read). No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C, decision 6: the unique key); ADR 0148 (decisions 1
 *                     and 3); ADR 0327 (decisions 2 and 8: the tenant level); ADR 0159 (as amended: expand and
 *                     contract).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The owner column's comment. */
const OWNER =
  "The owning tenant, or NULL for a platform job; filled from the call's tenant, never from input.";

/** The depth of a job's scope path, in labels (NULL with no scope). */
const DEPTH = `cardinality(string_to_array("scope_path", '.'))`;

/** What an environment refused for jobs does first. */
const DRAIN =
  "A job below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Drain the queue first: let reserved and pending jobs finish or fail, delete those dead jobs, then migrate again.";

/** Makes the job table tenant-owned in the platform form. */
export class ContractQueueTenancyMigration extends Migration {
  /** The column, the backfill, the pre-flight, the policies and system access, then the functions. */
  up(schema: SchemaBuilder): void {
    schema.table("jobs", (t: Blueprint) => {
      t.link("tenant_id").nullable().defaultSetting("app.tenant_id").comment(OWNER);
    });
    schema.sql(
      `update "queue"."jobs" set "tenant_id" = "scope_id" where "tenant_id" is null and ${DEPTH} = 3`,
      { inverse: false },
    );
    schema.refuseNulls("tenant_id", ["jobs"], DRAIN, { where: `${DEPTH} > 3` });
    schema.table("jobs", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "platform" });
      t.systemAccess({
        select: [
          "id",
          "tenant_id",
          "queue",
          "scope_id",
          "status",
          "attempts",
          "run_at",
          "locked_until",
          "lease",
          "priority",
          "scope_concurrency",
          "unique_key",
        ],
        update: ["status", "attempts", "locked_until"],
        reason:
          "the worker leases due jobs and the operator claims dead letters across tenants; a redrive checks unique keys",
      });
    });
    schema.systemFunction({
      name: "reserve_job",
      args: { only_queue: "varchar(63)", due_at: "timestamptz" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)" },
      sql: [
        "update queue.jobs as leased set status = 'running', attempts = leased.attempts + 1,",
        "locked_until = due_at + leased.lease::interval",
        "where leased.id = (select job.id from queue.jobs as job cross join lateral",
        "  (select count(*)::int as load from queue.jobs as other where other.queue = job.queue",
        "  and other.scope_id is not distinct from job.scope_id and other.status = 'running'",
        "  and other.locked_until > due_at) as running",
        "  where (only_queue is null or job.queue = only_queue)",
        "  and ((job.status = 'waiting' and job.run_at <= due_at)",
        "    or (job.status = 'running' and job.locked_until <= due_at))",
        "  and (job.scope_concurrency is null or running.load < job.scope_concurrency)",
        "  order by job.priority desc, running.load, job.run_at, job.id",
        "  limit 1 for update of job skip locked)",
        "returning leased.id, leased.tenant_id",
      ].join("\n"),
      reason:
        "the worker leases the next due job of every tenant fairly, then loads and settles it in its tenant",
    });
    schema.systemFunction({
      name: "claim_dead_jobs",
      args: { only_id: "varchar(33)", only_queue: "varchar(63)", max_jobs: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)" },
      sql: [
        "select job.id, job.tenant_id from queue.jobs as job",
        "where job.status = 'dead' and (only_id is null or job.id = only_id)",
        "and (only_queue is null or job.queue = only_queue)",
        "order by job.id limit max_jobs",
      ].join("\n"),
      reason:
        "the platform operator's queue commands list and redrive dead letters of every tenant, each in its tenant",
    });
    schema.systemFunction({
      name: "unique_key_holders",
      args: { held_key: "text" },
      returns: { id: "varchar(33)" },
      sql: [
        "select job.id from queue.jobs as job",
        "where job.unique_key = held_key and job.status in ('waiting', 'running')",
      ].join("\n"),
      reason:
        "a redrive must not revive a unique job while a live job of any tenant holds its key (the index is global)",
    });
  }
}
