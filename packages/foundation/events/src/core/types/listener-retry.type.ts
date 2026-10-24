/**
 * Stackra file contract:
 * Purpose: `ListenerRetry`, the `retry` option of a listener: how often a failed delivery is tried, and the wait
 *          before the next try.
 * Boundary: a type only; the queue driver that runs a queued listener applies it. The in-process bus runs a delivery
 *           once and records a failure instead of retrying.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: `Listener({ queue, retry })`); ADR 0078 (decision 4).
 */
import type { Duration } from "@stackra/contracts";

/** The retry policy of a listener. */
export interface ListenerRetry {
  /** The most tries of one delivery, the first included; a whole number from 1. */
  readonly attempts: number;

  /** The wait before the next try, as an ISO 8601 duration (`Duration.minutes(1)`). */
  readonly backoff?: Duration;
}
