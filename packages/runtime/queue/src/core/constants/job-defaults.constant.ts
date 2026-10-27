/**
 * Stackra file contract:
 * Purpose: `JOB_DEFAULTS`, what a job takes when its action's `job` option leaves a field out (or the action has no
 *          `job` option, for a queued call): queue `default`, three retries, exponential backoff, a five-minute timeout,
 *          a grace minute on each reservation, and the worker's one-second poll.
 * Boundary: a frozen constant, internal to this package and read by `readJob` and the worker. A job with no timeout
 *           is a review finding (ADR 0148), so the default is a floor, not a design.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1 and consequences); ADR 0305 (rule 28).
 */
import { Backoff, Duration } from "@stackra/contracts";

/** The job defaults. */
export const JOB_DEFAULTS = Object.freeze({
  queue: "default",
  retries: 3,
  backoff: Backoff.Exponential,
  timeout: Duration.minutes(5),
  leaseGrace: Duration.minutes(1),
  pollInterval: Duration.seconds(1),
});
