/**
 * Stackra file contract:
 * Purpose: `JobOptions`, an action's `job` option: the action also runs as a queued job, with its queue, uniqueness,
 *          timeout, retries, backoff, dead letter and an optional cron schedule.
 * Boundary: a type only; `@stackra/queue` and `@stackra/scheduler` read it from the manifest and run the job through
 *           this pipeline as a `Job` or `System` actor. The job's name is the action's key. `onDeadLetter` names a
 *           method of the action the queue calls once after the last retry.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 28 and 30: `job` is off by default; `job_without_system_actor`); owner decision
 *                     2026-10-24 (no `@Job` or `@Queue`).
 */
import type { JobCron } from "#core/types/job-cron.type";

/** An action's job surface. */
export interface JobOptions {
  /** The queue code (`Queues.Maintenance`); the default queue when absent. */
  readonly queue?: string;

  /** One run per scope at a time; an overlapping run is skipped, not queued twice. */
  readonly unique?: boolean;

  /** How long one run may take, as a duration (`"2m"`). */
  readonly timeout?: string;

  /** Retries after the first failure, a whole number from 0. */
  readonly retries?: number;

  /** The queue's backoff code between retries (`Backoff.Exponential`). */
  readonly backoff?: string;

  /** Keep a run that failed its last retry in the dead-letter queue. */
  readonly deadLetter?: boolean;

  /** The name of the action's method called once when a run is dead-lettered. */
  readonly onDeadLetter?: string;

  /** Dispatch on a schedule as well. */
  readonly cron?: JobCron;
}
