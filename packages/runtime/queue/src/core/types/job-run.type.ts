/**
 * Stackra file contract:
 * Purpose: `JobRun`, how one attempt of a job went, as the worker returns it: the reserved job, the outcome, and the
 *          output, the error or the time of the next attempt.
 * Boundary: a type only; `QueueWorkerService.process` and `drain` return it, `runJob` in a test collects it. The error
 *           is what the attempt threw (a refusal, a `JobTimedOutError`, or a bug).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1).
 */
import type { QueuedJob } from "#contracts/index";
import type { JobOutcome } from "#core/enums/job-outcome.enum";

/** One attempt of a job. */
export interface JobRun {
  /** The job as reserved for the attempt; `attempts` counts this one. */
  readonly job: QueuedJob;

  /** How the attempt ended. */
  readonly outcome: JobOutcome;

  /** The action's output, when it is `done`. */
  readonly output?: unknown;

  /** What the attempt threw, when it failed. */
  readonly error?: unknown;

  /** When the next attempt is due, when it is `retried` or `throttled`. */
  readonly retryAt?: Date;
}
