/**
 * Stackra file contract:
 * Purpose: `JobThrottle`, how often jobs that call one third party may start: at most `perMinute` attempts a minute,
 *          counted in the token bucket named `key`, shared by every job that names the same key.
 * Boundary: a type only; the worker takes one token from the `RateLimitStore` before each attempt and, when none is
 *           free, makes the job wait for the next token without counting the attempt.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 2: fair queues and per-job throttles); ADR 0217 (decision 2: token buckets).
 */

/** A per-job throttle. */
export interface JobThrottle {
  /** Attempts a minute, a whole number from 1; the bucket holds and refills this many a minute. */
  readonly perMinute: number;

  /** The bucket the throttle counts in (`stripe`); jobs naming the same key share it. */
  readonly key: string;
}
