/**
 * Stackra file contract:
 * Purpose: the `WorkflowJournal` port: the durable store of the native engine. It keeps every run with its steps, holds
 *          sent signals until a run takes them, lists the runs a tick must advance and the runs of one automation, and
 *          opens the transaction each step commits in. Config `workflow.journal` picks the driver (`postgres`,
 *          `memory`).
 * Boundary: an abstract class that is its own token, keyed `workflow.WorkflowJournal`. A driver stores and lists; it
 *           never runs a step, computes a backoff or reads a clock: the engine passes every time. `transaction` runs
 *           work in a transaction of its own (a run's steps commit whatever the calling action does) inside a scope's
 *           session; `hold` and `currentScope` join the caller's transaction. The engine is in core, so this port sits
 *           in core beside it (its records name the core enums `StepStatus` and `WorkflowRunStatus`).
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 1: the Postgres journal); ADR 0292 (decision 2: the Postgres-journal driver is
 *                     the default); ADR 0142 (drivers behind ports); ADR 0327 (decisions 3 and 9: the scope session);
 *                     ADR 0152 (decision 4: inspect).
 */
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { HeldSignal } from "#core/types/held-signal.type";
import type { WorkflowRun } from "#core/types/workflow-run.type";

/**
 * A workflow journal.
 *
 * @example
 * export class SqliteWorkflowJournalDriver extends Driver(WorkflowJournal) {
 *   async save(run: WorkflowRun): Promise<void> { ... }
 * }
 */
export abstract class WorkflowJournal extends Port {
  /** Type-only port key, so `DriverName<WorkflowJournal>` narrows to this port's drivers. */
  declare readonly "~key": "workflow.WorkflowJournal";

  /** Runs `work` in a transaction of its own that commits when it resolves, with `scope` as its session's scope. */
  abstract transaction<T>(scope: ScopeRef | undefined, work: () => Promise<T>): Promise<T>;

  /** The scope of the caller's session; `undefined` outside one. */
  abstract currentScope(): Promise<ScopeRef | undefined>;

  /** Inserts or updates `run` and each of its steps. */
  abstract save(run: WorkflowRun): Promise<void>;

  /** Run `id` with its steps in the order they were reached. */
  abstract find(id: PublicId<"wfr">): Promise<WorkflowRun | undefined>;

  /** The latest run of `workflow` (a registered key), by start time. */
  abstract last(workflow: string): Promise<WorkflowRun | undefined>;

  /**
   * Up to `limit` runs of `automation`, newest start first (the greater id within one instant), each started before
   * `before` when it is given, so a caller pages by the last run's `startedAt`.
   */
  abstract byAutomation(
    automation: PublicId<"wfa">,
    limit: number,
    before?: Date,
  ): Promise<readonly WorkflowRun[]>;

  /** Holds `signal` in the caller's transaction. */
  abstract hold(signal: HeldSignal): Promise<void>;

  /**
   * Removes and returns the oldest held `signal` with `correlation` in `scope` that arrived at or before `before`.
   * Two callers never take the same one.
   */
  abstract take(
    signal: string,
    correlation: string,
    scope: ScopeRef | undefined,
    before: Date,
  ): Promise<HeldSignal | undefined>;

  /**
   * Up to `limit` runs to advance at `now`, oldest first: every running or compensating run (one whose runner died is
   * free to take over), and each waiting run whose deadline or wait passed or whose awaited signal is held.
   */
  abstract due(now: Date, limit: number): Promise<readonly PublicId<"wfr">[]>;

  /** Drops the held signals that lapsed at `now`. */
  abstract expire(now: Date): Promise<void>;
}
