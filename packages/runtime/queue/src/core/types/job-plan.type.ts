/**
 * Stackra file contract:
 * Purpose: `JobPlan`, how the queue runs one action: its job key, whether it declares a `job` option, the actor kind a
 *          job of it runs as, and its queue, uniqueness, timeout, retries, backoff and dead letter with the defaults
 *          applied.
 * Boundary: a type only, internal to this package; `readJob` builds it from the action's recorded options.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 28 and 30); ADR 0148 (decision 1).
 */
import type { ActorKind, Backoff, Duration } from "@stackra/contracts";

/** The job settings of one action. */
export interface JobPlan {
  /** The key the job is stored under: the registered locked key, else the written key. */
  readonly key: string;

  /** Whether the action declares a `job` option; a queued call of an action without one runs as its caller. */
  readonly declared: boolean;

  /** `job` when the action lists `ActorKind.Job`, else `system` (`Action({ job })` requires one of the two). */
  readonly actor: typeof ActorKind.Job | typeof ActorKind.System;

  /** The worker queue. */
  readonly queue: string;

  /** One waiting or running job per scope at a time. */
  readonly unique: boolean;

  /** How long one attempt may run. */
  readonly timeout: Duration;

  /** Retries after the first attempt. */
  readonly retries: number;

  /** The wait between attempts. */
  readonly backoff: Backoff;

  /** Keep a job that failed its last attempt in the dead-letter queue. */
  readonly deadLetter: boolean;

  /** The action's method called once after a dead letter. */
  readonly onDeadLetter?: string;
}
