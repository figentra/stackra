/**
 * Stackra file contract:
 * Purpose: `PostgresWorkflowJournalDriver`, the durable `WorkflowJournal` (ADR 0292's Postgres journal): runs, their
 *          steps and held signals are rows of `workflow.runs`, `workflow.steps` and `workflow.signals`; a run's writes
 *          commit in transactions of their own inside the run's scope session, and the worker's scan reads across
 *          scopes.
 * Boundary: raw SQL on the running context's entity manager, every value a bound parameter and every result row read
 *           through zod. No table has a row-level-security policy (the worker advances every scope's runs); a held
 *           signal is matched to a run of the same scope by its `scope_id`, and `take` locks the row it removes
 *           (`for update skip locked`) so two runners never take one signal. JSON columns are `jsonb`; scope paths are
 *           `ltree`, read back as text. A run's pinned version is `version` (migration 0002; 1 for older rows); the
 *           automation a run runs is `automation_id` (migration 0007, null for other runs).
 * Runtime: node
 * Governing contract: ADR 0102 (decision 1); ADR 0292 (decision 2); ADR 0160 (raw SQL is parameterised and typed with
 *                     zod); ADR 0142 (drivers behind ports); ADR 0327 (decisions 3 and 9: the scope session).
 */
import { Driver } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import type { Json, PublicId, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { StepStatus, WorkflowJournal, WorkflowRunStatus } from "#core/index";
import type { HeldSignal, RunOrigin, WorkflowRun, WorkflowStepRecord } from "#core/index";

/** The run table, in the package's schema. */
const RUNS = '"workflow"."runs"';

/** The step table. */
const STEPS = '"workflow"."steps"';

/** The held-signal table. */
const SIGNALS = '"workflow"."signals"';

/** The columns a run is read from. */
const RUN_COLUMNS =
  "id, workflow, version, automation_id, status, input, origin, error, scope_id, " +
  "scope_path::text as scope_path, started_at, deadline_at, ended_at";

/** The columns a step is read from. */
const STEP_COLUMNS =
  "name, status, attempts, result, error, progress, signal, correlation, wake_at, started_at, ended_at";

/** The columns a held signal is read from. */
const SIGNAL_COLUMNS =
  "id, signal, correlation, payload, scope_id, scope_path::text as scope_path, received_at, expires_at";

/** A recorded failure. */
const FAILURE = z.object({ code: z.string(), message: z.string() });

/** One row of `workflow.runs`. */
const RUN = z.object({
  id: z.string().startsWith("wfr_"),
  workflow: z.string(),
  version: z.number().int().min(1),
  automation_id: z.string().startsWith("wfa_").nullable(),
  status: z.enum(Enum.values(WorkflowRunStatus) as [WorkflowRunStatus, ...WorkflowRunStatus[]]),
  input: z.unknown(),
  origin: z.record(z.string(), z.unknown()),
  error: FAILURE.nullable(),
  scope_id: z.string().nullable(),
  scope_path: z.string().nullable(),
  started_at: z.coerce.date(),
  deadline_at: z.coerce.date().nullable(),
  ended_at: z.coerce.date().nullable(),
});

/** One row of `workflow.steps`. */
const STEP = z.object({
  name: z.string(),
  status: z.enum(Enum.values(StepStatus) as [StepStatus, ...StepStatus[]]),
  attempts: z.number().int(),
  result: z.unknown(),
  error: FAILURE.nullable(),
  progress: z.unknown(),
  signal: z.string().nullable(),
  correlation: z.string().nullable(),
  wake_at: z.coerce.date().nullable(),
  started_at: z.coerce.date(),
  ended_at: z.coerce.date().nullable(),
});

/** One row of `workflow.signals`. */
const SIGNAL = z.object({
  id: z.string().startsWith("wfs_"),
  signal: z.string(),
  correlation: z.string(),
  payload: z.record(z.string(), z.unknown()),
  scope_id: z.string().nullable(),
  scope_path: z.string().nullable(),
  received_at: z.coerce.date(),
  expires_at: z.coerce.date(),
});

/** The session's scope settings. */
const SCOPE = z.object({ scope_id: z.string().nullable(), scope_path: z.string().nullable() });

/** Run ids. */
const IDS = z.array(z.object({ id: z.string().startsWith("wfr_") }));

/** The scope of a row's two columns, when both are set. */
function scopeOf(id: string | null, path: string | null): { readonly scope?: ScopeRef } {
  return id === null || path === null ? {} : { scope: { id: id as PublicId<"scp">, path } };
}

/** The step of one row. */
function stepOf(row: z.infer<typeof STEP>): WorkflowStepRecord {
  return Object.freeze({
    name: row.name,
    status: row.status,
    attempts: row.attempts,
    ...(row.result === null || row.result === undefined ? {} : { result: row.result }),
    ...(row.error === null ? {} : { error: row.error }),
    ...(row.progress === null || row.progress === undefined
      ? {}
      : { progress: row.progress as Json }),
    ...(row.signal === null ? {} : { signal: row.signal }),
    ...(row.correlation === null ? {} : { correlation: row.correlation }),
    ...(row.wake_at === null ? {} : { wakeAt: row.wake_at }),
    startedAt: row.started_at,
    ...(row.ended_at === null ? {} : { endedAt: row.ended_at }),
  });
}

/** The run of one row and its step rows. */
function runOf(row: z.infer<typeof RUN>, steps: readonly z.infer<typeof STEP>[]): WorkflowRun {
  return Object.freeze({
    id: row.id as PublicId<"wfr">,
    workflow: row.workflow,
    version: row.version,
    ...(row.automation_id === null ? {} : { automation: row.automation_id as PublicId<"wfa"> }),
    status: row.status,
    input: row.input,
    origin: row.origin as unknown as RunOrigin,
    ...scopeOf(row.scope_id, row.scope_path),
    ...(row.error === null ? {} : { error: row.error }),
    startedAt: row.started_at,
    ...(row.deadline_at === null ? {} : { deadlineAt: row.deadline_at }),
    ...(row.ended_at === null ? {} : { endedAt: row.ended_at }),
    steps: Object.freeze(steps.map(stepOf)),
  });
}

/** The held signal of one row. */
function signalOf(row: z.infer<typeof SIGNAL>): HeldSignal {
  return Object.freeze({
    id: row.id as PublicId<"wfs">,
    signal: row.signal,
    correlation: row.correlation,
    payload: row.payload,
    ...scopeOf(row.scope_id, row.scope_path),
    receivedAt: row.received_at,
    expiresAt: row.expires_at,
  });
}

/**
 * Keeps the workflow journal in Postgres.
 *
 * @example
 * // generated wiring: { port: WorkflowJournal, selectedBy: "config:workflow.journal", candidates: { postgres: … } }
 */
export class PostgresWorkflowJournalDriver extends Driver(WorkflowJournal) {
  /** The connected database. */
  private readonly database: Database;

  /** @param database - the connected database whose transactions the journal opens and joins. */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** See `WorkflowJournal.transaction`: a new transaction, with `scope`'s settings (none for a platform run). */
  transaction<T>(scope: ScopeRef | undefined, work: () => Promise<T>): Promise<T> {
    return this.database.transaction(() => this.database.withScope(scope ?? [], work), {
      requiresNew: true,
    });
  }

  /** See `WorkflowJournal.currentScope`: read from the caller's transaction's scope settings. */
  async currentScope(): Promise<ScopeRef | undefined> {
    // raw-sql: the scope settings are session state, which only SQL reads
    const rows = await this.database
      .em()
      .execute(
        "select nullif(current_setting('app.scope_id', true), '') as scope_id, " +
          "nullif(current_setting('app.scope_path', true), '') as scope_path",
      );
    const [row] = z.array(SCOPE).parse(rows);
    return row === undefined ? undefined : scopeOf(row.scope_id, row.scope_path).scope;
  }

  /** See `WorkflowJournal.save`. */
  async save(run: WorkflowRun): Promise<void> {
    const em = this.database.em();
    // raw-sql: the journal has no model; one upsert for the run and one for all its steps
    await em.execute(
      `insert into ${RUNS} (id, workflow, version, automation_id, status, input, origin, error, scope_id, ` +
        "scope_path, started_at, deadline_at, ended_at) " +
        "values (?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?, ?::ltree, ?, ?, ?) " +
        "on conflict (id) do update set status = excluded.status, error = excluded.error, ended_at = excluded.ended_at",
      [
        run.id,
        run.workflow,
        run.version ?? 1,
        run.automation ?? null,
        run.status,
        JSON.stringify(run.input ?? null),
        JSON.stringify(run.origin),
        run.error === undefined ? null : JSON.stringify(run.error),
        run.scope?.id ?? null,
        run.scope?.path ?? null,
        run.startedAt,
        run.deadlineAt ?? null,
        run.endedAt ?? null,
      ],
    );
    if (run.steps.length === 0) return;
    const rows = run.steps.map((step, position) => ({
      name: step.name,
      position,
      status: step.status,
      attempts: step.attempts,
      result: step.result ?? null,
      error: step.error ?? null,
      progress: step.progress ?? null,
      signal: step.signal ?? null,
      correlation: step.correlation ?? null,
      wake_at: step.wakeAt ?? null,
      started_at: step.startedAt,
      ended_at: step.endedAt ?? null,
    }));
    await em.execute(
      `insert into ${STEPS} (run_id, name, position, status, attempts, result, error, progress, signal, correlation, ` +
        "wake_at, started_at, ended_at) select ?, s.name, s.position, s.status, s.attempts, s.result, s.error, " +
        "s.progress, s.signal, s.correlation, s.wake_at, s.started_at, s.ended_at from jsonb_to_recordset(?::jsonb) " +
        "as s(name text, position integer, status text, attempts integer, result jsonb, error jsonb, progress jsonb, " +
        "signal text, correlation text, wake_at timestamptz, started_at timestamptz, ended_at timestamptz) " +
        "on conflict (run_id, name) do update set position = excluded.position, status = excluded.status, " +
        "attempts = excluded.attempts, result = excluded.result, error = excluded.error, progress = excluded.progress, " +
        "signal = excluded.signal, correlation = excluded.correlation, wake_at = excluded.wake_at, " +
        "ended_at = excluded.ended_at",
      [run.id, JSON.stringify(rows)],
    );
  }

  /** See `WorkflowJournal.find`. */
  async find(id: PublicId<"wfr">): Promise<WorkflowRun | undefined> {
    const em = this.database.em();
    // raw-sql: the journal has no model; the run, then its steps in the order they were reached
    const [row] = z
      .array(RUN)
      .parse(await em.execute(`select ${RUN_COLUMNS} from ${RUNS} where id = ?`, [id]));
    if (row === undefined) return undefined;
    const steps = z
      .array(STEP)
      .parse(
        await em.execute(
          `select ${STEP_COLUMNS} from ${STEPS} where run_id = ? order by position`,
          [id],
        ),
      );
    return runOf(row, steps);
  }

  /** See `WorkflowJournal.last`: the latest start, the greater id within one instant (ids grow with time). */
  async last(workflow: string): Promise<WorkflowRun | undefined> {
    // raw-sql: the journal has no model; served by idx_runs_workflow_started_at
    const [row] = IDS.parse(
      await this.database
        .em()
        .execute(
          `select id from ${RUNS} where workflow = ? order by started_at desc, id desc limit 1`,
          [workflow],
        ),
    );
    return row === undefined ? undefined : this.find(row.id as PublicId<"wfr">);
  }

  /** See `WorkflowJournal.byAutomation`. */
  async byAutomation(
    automation: PublicId<"wfa">,
    limit: number,
    before?: Date,
  ): Promise<readonly WorkflowRun[]> {
    // raw-sql: the journal has no model; served by idx_runs_automation_id_started_at
    const rows = IDS.parse(
      await this.database
        .em()
        .execute(
          `select id from ${RUNS} where automation_id = ? and (?::timestamptz is null or started_at < ?) ` +
            "order by started_at desc, id desc limit ?",
          [automation, before ?? null, before ?? null, limit],
        ),
    );
    // shortcut: one read per run (its steps included); add a step-less listing read if pages grow past a screen.
    const runs: WorkflowRun[] = [];
    for (const row of rows) {
      // oxlint-disable-next-line no-await-in-loop -- one run after another, in page order
      const run = await this.find(row.id as PublicId<"wfr">);
      if (run !== undefined) runs.push(run);
    }
    return runs;
  }

  /** See `WorkflowJournal.hold`. */
  async hold(signal: HeldSignal): Promise<void> {
    // raw-sql: the journal has no model; one insert in the caller's transaction
    await this.database
      .em()
      .execute(
        `insert into ${SIGNALS} (id, signal, correlation, payload, scope_id, scope_path, received_at, expires_at) ` +
          "values (?, ?, ?, ?::jsonb, ?, ?::ltree, ?, ?)",
        [
          signal.id,
          signal.signal,
          signal.correlation,
          JSON.stringify(signal.payload),
          signal.scope?.id ?? null,
          signal.scope?.path ?? null,
          signal.receivedAt,
          signal.expiresAt,
        ],
      );
  }

  /** See `WorkflowJournal.take`. */
  async take(
    signal: string,
    correlation: string,
    scope: ScopeRef | undefined,
    before: Date,
  ): Promise<HeldSignal | undefined> {
    // raw-sql: the journal has no model; the oldest match is locked and removed in one statement
    const rows = await this.database
      .em()
      .execute(
        `delete from ${SIGNALS} where id = (select id from ${SIGNALS} where signal = ? and correlation = ? ` +
          "and scope_id is not distinct from ? and received_at <= ? order by received_at, id limit 1 " +
          `for update skip locked) returning ${SIGNAL_COLUMNS}`,
        [signal, correlation, scope?.id ?? null, before],
      );
    const [row] = z.array(SIGNAL).parse(rows);
    return row === undefined ? undefined : signalOf(row);
  }

  /** See `WorkflowJournal.due`. */
  async due(now: Date, limit: number): Promise<readonly PublicId<"wfr">[]> {
    // raw-sql: the journal has no model; the worker reads across scopes, oldest run first
    const rows = await this.database
      .em()
      .execute(
        `select r.id from ${RUNS} r where r.status in ('running', 'compensating') or (r.status = 'waiting' and ` +
          `(r.deadline_at <= ? or exists (select 1 from ${STEPS} s where s.run_id = r.id and s.status = 'waiting' ` +
          `and (s.wake_at <= ? or exists (select 1 from ${SIGNALS} g where g.signal = s.signal ` +
          "and g.correlation = s.correlation and g.scope_id is not distinct from r.scope_id))))) " +
          "order by r.started_at, r.id limit ?",
        [now, now, limit],
      );
    return IDS.parse(rows).map((row) => row.id as PublicId<"wfr">);
  }

  /** See `WorkflowJournal.expire`. */
  async expire(now: Date): Promise<void> {
    // raw-sql: the journal has no model; one parameterised delete
    await this.database.em().execute(`delete from ${SIGNALS} where expires_at <= ?`, [now]);
  }
}
