/**
 * Stackra file contract:
 * Purpose: the `WorkflowJournal` port: the durable store of the native engine. It keeps every run with its steps, holds
 *          sent signals until a run takes them, claims the runs a tick must advance and the signals that lapsed, lists
 *          the runs of one automation, and opens the transaction each step commits in. Config `workflow.journal` picks
 *          the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `workflow.WorkflowJournal`. A driver stores and lists; it
 *           never runs a step, computes a backoff or reads a clock: the engine passes every time. `transaction` runs
 *           work in a transaction of its own (a run's steps commit whatever the calling action does) inside a scope's
 *           session; `hold`, `currentScope` and `currentOwner` join the caller's transaction. The tables are tenant-owned
 *           in the platform form (ADR 0239 amendment, gaps A and C): every read and write but the two claims sees only
 *           the session's tenant and the platform's rows, a writer stores the session's tenant (never one it is given),
 *           and `due` and `expired` claim across tenants (ids, owner, order) so the engine loads, advances or removes
 *           each in its owner's isolation. The engine is in core, so this port sits in core beside it (its records
 *           name the core enums `StepStatus` and `WorkflowRunStatus`).
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 1: the Postgres journal); ADR 0292 (decision 2: the Postgres-journal driver is
 *                     the default); ADR 0142 (drivers behind ports); ADR 0327 (decisions 3 and 9: the scope session);
 *                     ADR 0152 (decision 4: inspect); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { HeldSignal } from "#core/types/held-signal.type";
import type { RunClaim } from "#core/types/run-claim.type";
import type { SignalClaim } from "#core/types/signal-claim.type";
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

  /** The tenant of the caller's session, which a run started there is owned by; `undefined` for none. */
  abstract currentOwner(): Promise<PublicId<"scp"> | undefined>;

  /** Inserts or updates `run` and each of its steps, owned by the session's tenant. */
  abstract save(run: WorkflowRun): Promise<void>;

  /** Run `id` with its steps in the order they were reached, as the session sees it (a claim's load). */
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
   * Claims, across tenants, up to `limit` runs to advance at `now`, oldest first: every running or compensating run (one
   * whose runner died is free to take over), and each waiting run whose deadline or wait passed or whose awaited
   * signal is held in its own tenant. A claim holds no lease: the run's lock is the engine's.
   */
  abstract due(now: Date, limit: number): Promise<readonly RunClaim[]>;

  /** Claims, across tenants, up to `limit` held signals that lapsed at `now`, oldest lapse first. */
  abstract expired(now: Date, limit: number): Promise<readonly SignalClaim[]>;

  /** Removes the held signals `ids` the session sees. */
  abstract remove(ids: readonly PublicId<"wfs">[]): Promise<void>;
}
