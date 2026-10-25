/**
 * Stackra file contract:
 * Purpose: `QUEUE_LOG_EVENTS`, the structured log events of the worker: a job dropped after its last attempt, a failed
 *          `onDeadLetter` hook, and a worker loop that could not reach its store.
 * Boundary: a frozen constant, internal to this package; the worker writes these through the `Logger` port when one is
 *           bound, with the job id, key and attempts and the caught error as `cause`, never the input.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (structured log events); ADR 0148 (decision 1).
 */

/** The worker's log events. */
export const QUEUE_LOG_EVENTS = Object.freeze({
  /** A job without a dead letter failed its last attempt and was removed. */
  jobDropped: "queue.job_dropped",
  /** The action's `onDeadLetter` method threw. */
  deadLetterHookFailed: "queue.dead_letter_hook_failed",
  /** A worker loop failed to reserve or record a job and paused. */
  workerFailed: "queue.worker_failed",
});
