/**
 * Stackra file contract:
 * Purpose: `PostgresQueueDriver`, the server's `QueueDriver`: jobs are rows of `queue.jobs`; a reservation is one
 *          `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1)`, so concurrent workers never take the same
 *          job and never wait on each other; a unique job's conflict is the partial unique index on `unique_key`. The
 *          pick is fair: priority, then the scope with the fewest running jobs on the queue (a lateral count), then
 *          `run_at`, skipping a scope at its `scope_concurrency`. Batches are rows of `queue.job_batches`.
 * Boundary: raw SQL on the running context's entity manager, one statement per method, every value a bound parameter
 *           and every result row read through zod. A push inside an action's transaction joins it, so the job commits
 *           with the action's writes or not at all. The table is the platform's job store, read by workers across
 *           scopes; the worker opens each job's scope session itself. Input, origin and last error are `jsonb`.
 * Runtime: node
 * Governing contract: ADR 0148 (decisions 1, 2 and 3: fair queues, Postgres with SKIP LOCKED); ADR 0160 (raw SQL is parameterised and
 *                     typed with zod); ADR 0142 (drivers behind ports); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import type { Actor, Duration, PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { JobStatus, QueueDriver } from "#contracts/index";
import type { ChainedJob, JobBatch, JobError, JobThrottle, QueuedJob } from "#contracts/index";

/** The job table, in the package's schema. */
const TABLE = '"queue"."jobs"';

/** The batch table, in the package's schema. */
const BATCHES = '"queue"."job_batches"';

/** The columns a job is read from. */
const COLUMNS =
  "id, queue, job_key, input, origin, scope_id, scope_path, idempotency_key, unique_key, caused_by, status, attempts, run_at, lease, last_error, " +
  "priority, scope_concurrency, throttle, batch_id, chain";

/** One row of `queue.jobs`. */
const ROW = z.object({
  id: z.string().startsWith("job_"),
  queue: z.string(),
  job_key: z.string(),
  input: z.unknown(),
  origin: z.record(z.string(), z.unknown()).nullable(),
  scope_id: z.string().nullable(),
  scope_path: z.string().nullable(),
  idempotency_key: z.string().nullable(),
  unique_key: z.string().nullable(),
  caused_by: z.string().nullable(),
  status: z.enum(Enum.values(JobStatus) as [JobStatus, ...JobStatus[]]),
  attempts: z.number().int(),
  run_at: z.coerce.date(),
  lease: z.string(),
  last_error: z.object({ code: z.string(), message: z.string() }).nullable(),
  priority: z.number().int(),
  scope_concurrency: z.number().int().nullable(),
  throttle: z.object({ perMinute: z.number().int(), key: z.string() }).nullable(),
  batch_id: z.string().nullable(),
  chain: z.array(z.object({ key: z.string(), input: z.unknown() })).nullable(),
});

/** One row of `queue.job_batches`. */
const BATCH = z.object({
  id: z.string(),
  total: z.number().int(),
  done: z.number().int(),
  failed: z.number().int(),
});

/** Rows of `queue.job_batches`. */
const BATCH_ROWS = z.array(BATCH);

/** Rows of `queue.jobs`. */
const ROWS = z.array(ROW);

/** Rows that carry only the job id. */
const IDS = z.array(z.object({ id: z.string() }));

/** The job of one row. */
function jobOf(row: z.infer<typeof ROW>): QueuedJob {
  return Object.freeze({
    id: row.id as PublicId<"job">,
    queue: row.queue,
    key: row.job_key,
    input: row.input,
    ...(row.origin === null ? {} : { origin: row.origin as unknown as Actor }),
    ...(row.scope_id === null || row.scope_path === null
      ? {}
      : { scope: { id: row.scope_id as PublicId<"scp">, path: row.scope_path } }),
    ...(row.idempotency_key === null ? {} : { idempotencyKey: row.idempotency_key }),
    ...(row.unique_key === null ? {} : { uniqueKey: row.unique_key }),
    ...(row.caused_by === null ? {} : { causedBy: row.caused_by }),
    status: row.status,
    attempts: row.attempts,
    runAt: row.run_at,
    lease: row.lease as Duration,
    ...(row.last_error === null ? {} : { lastError: row.last_error }),
    ...(row.priority === 0 ? {} : { priority: row.priority }),
    ...(row.scope_concurrency === null ? {} : { scopeConcurrency: row.scope_concurrency }),
    ...(row.throttle === null ? {} : { throttle: row.throttle as JobThrottle }),
    ...(row.batch_id === null ? {} : { batchId: row.batch_id }),
    ...(row.chain === null ? {} : { chain: row.chain as readonly ChainedJob[] }),
  });
}

/** The first batch of `rows`, if any. */
function batchOf(rows: unknown): JobBatch | undefined {
  const [row] = BATCH_ROWS.parse(rows);
  return row === undefined ? undefined : Object.freeze({ ...row });
}

/**
 * Keeps jobs in Postgres.
 *
 * @example
 * // generated wiring: { port: QueueDriver, selectedBy: "config:queue.driver", candidates: { postgres: … } }
 */
export class PostgresQueueDriver extends Driver(QueueDriver) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Stores `job` as waiting; `false` when a live job holds its `uniqueKey`. */
  async push(job: QueuedJob): Promise<boolean> {
    // raw-sql: a unique job's conflict is decided by the partial unique index, which the ORM's insert cannot target
    const rows = await this.database
      .em()
      .execute(
        `insert into ${TABLE} (id, queue, job_key, input, origin, scope_id, scope_path, idempotency_key, unique_key, caused_by, status, attempts, run_at, lease, ` +
          "priority, scope_concurrency, throttle, batch_id, chain) " +
          "values (?, ?, ?, ?::jsonb, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?::jsonb) " +
          "on conflict (unique_key) where status in ('waiting', 'running') do nothing returning id",
        [
          job.id,
          job.queue,
          job.key,
          JSON.stringify(job.input ?? null),
          job.origin === undefined ? null : JSON.stringify(job.origin),
          job.scope?.id ?? null,
          job.scope?.path ?? null,
          job.idempotencyKey ?? null,
          job.uniqueKey ?? null,
          job.causedBy ?? null,
          job.status,
          job.attempts,
          job.runAt,
          job.lease,
          job.priority ?? 0,
          job.scopeConcurrency ?? null,
          job.throttle === undefined ? null : JSON.stringify(job.throttle),
          job.batchId ?? null,
          job.chain === undefined ? null : JSON.stringify(job.chain),
        ],
      );
    return IDS.parse(rows).length > 0;
  }

  /**
   * Reserves the next due job of `queue`, as `QueueDriver.reserve` describes.
   *
   * shortcut: the scope load is a lateral count per due row and two workers reserving at the same instant may each let
   * one job past a scope's cap; keep a per-scope running counter row when a queue holds tens of thousands of due jobs.
   */
  async reserve(queue: string | undefined, now: Date): Promise<QueuedJob | undefined> {
    const filter = queue === undefined ? "" : "job.queue = ? and ";
    const params = queue === undefined ? [now, now, now, now] : [now, now, queue, now, now];
    // raw-sql: FOR UPDATE SKIP LOCKED hands each due job to one worker without blocking the others (ADR 0148 d3); the
    // lateral count orders scopes by their running jobs, so one scope cannot starve the others (ADR 0148 d2)
    const rows = await this.database
      .em()
      .execute(
        `update ${TABLE} set status = 'running', attempts = attempts + 1, ` +
          "locked_until = ?::timestamptz + lease::interval, updated_at = now() " +
          `where id = (select job.id from ${TABLE} as job cross join lateral ` +
          `(select count(*)::int as load from ${TABLE} as other where other.queue = job.queue ` +
          "and other.scope_id is not distinct from job.scope_id and other.status = 'running' " +
          `and other.locked_until > ?) as running where ${filter}` +
          "((job.status = 'waiting' and job.run_at <= ?) or (job.status = 'running' and job.locked_until <= ?)) " +
          "and (job.scope_concurrency is null or running.load < job.scope_concurrency) " +
          "order by job.priority desc, running.load, job.run_at, job.id limit 1 for update of job skip locked) " +
          `returning ${COLUMNS}`,
        params,
      );
    const [row] = ROWS.parse(rows);
    return row === undefined ? undefined : jobOf(row);
  }

  /** Makes job `id` wait again until `runAt`, keeping `error`. */
  async retry(id: PublicId<"job">, runAt: Date, error: JobError): Promise<void> {
    // raw-sql: the job table has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set status = 'waiting', run_at = ?, locked_until = null, last_error = ?::jsonb, ` +
          "updated_at = now() where id = ?",
        [runAt, JSON.stringify(error), id],
      );
  }

  /** Makes running job `id` wait again until `runAt`, giving back the attempt its reservation took. */
  async release(id: PublicId<"job">, runAt: Date): Promise<void> {
    // raw-sql: the job table has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set status = 'waiting', run_at = ?, locked_until = null, ` +
          "attempts = greatest(attempts - 1, 0), updated_at = now() where id = ?",
        [runAt, id],
      );
  }

  /** Moves job `id` to the dead letters, keeping `error`. */
  async deadLetter(id: PublicId<"job">, error: JobError): Promise<void> {
    // raw-sql: the job table has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set status = 'dead', locked_until = null, last_error = ?::jsonb, updated_at = now() ` +
          "where id = ?",
        [JSON.stringify(error), id],
      );
  }

  /** Deletes job `id` once it is done. */
  async remove(id: PublicId<"job">): Promise<void> {
    // raw-sql: the job table has no model; one parameterised delete
    await this.database.em().execute(`delete from ${TABLE} where id = ?`, [id]);
  }

  /** Lists up to `limit` dead-lettered jobs of `queue`, oldest first. */
  async deadLetters(queue: string | undefined, limit: number): Promise<readonly QueuedJob[]> {
    const filter = queue === undefined ? "" : " and queue = ?";
    const params = queue === undefined ? [limit] : [queue, limit];
    // raw-sql: the job table has no model; ids are UUIDv7, so ordering by id is queue order
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from ${TABLE} where status = 'dead'${filter} order by id limit ?`,
        params,
      );
    return ROWS.parse(rows).map(jobOf);
  }

  /** Makes dead job `id` wait again from `now`; `false` when it cannot. */
  async redrive(id: PublicId<"job">, now: Date): Promise<boolean> {
    // raw-sql: the unique-key guard is a correlated NOT EXISTS, which a typed filter cannot express
    const rows = await this.database
      .em()
      .execute(
        `update ${TABLE} as job set status = 'waiting', attempts = 0, run_at = ?, locked_until = null, ` +
          "updated_at = now() where job.id = ? and job.status = 'dead' and (job.unique_key is null or not exists " +
          `(select 1 from ${TABLE} as other where other.unique_key = job.unique_key ` +
          "and other.status in ('waiting', 'running'))) returning job.id as id",
        [now, id],
      );
    return IDS.parse(rows).length > 0;
  }

  /** Stores `batch` in the batch table. */
  async openBatch(batch: JobBatch): Promise<void> {
    // raw-sql: the batch table has no model; one parameterised insert
    await this.database
      .em()
      .execute(`insert into ${BATCHES} (id, total, done, failed) values (?, ?, ?, ?)`, [
        batch.id,
        batch.total,
        batch.done,
        batch.failed,
      ]);
  }

  /** Counts one job of batch `id` as done or failed, atomically. */
  async settleBatch(id: string, failed: boolean): Promise<JobBatch | undefined> {
    const column = failed ? "failed" : "done";
    // raw-sql: an in-place increment, so concurrent workers never lose a count
    const rows = await this.database
      .em()
      .execute(
        `update ${BATCHES} set ${column} = ${column} + 1, updated_at = now() where id = ? ` +
          "returning id, total, done, failed",
        [id],
      );
    return batchOf(rows);
  }

  /** Batch `id`, if stored. */
  async batch(id: string): Promise<JobBatch | undefined> {
    // raw-sql: the batch table has no model; one parameterised select
    const rows = await this.database
      .em()
      .execute(`select id, total, done, failed from ${BATCHES} where id = ?`, [id]);
    return batchOf(rows);
  }
}
