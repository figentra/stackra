/**
 * Stackra file contract:
 * Purpose: `ListenerOptions`, what the called form `Listener({ queue, retry })` takes: the worker queue that runs the
 *          listener instead of the request, and its retry policy.
 * Boundary: a type only. A queue name comes from the member's generated `Queues` (`#stackra/queues`), which gen
 *           checks against `runway.yaml`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0296 (runway queues); owner D10 2026-10-28 (stackra-223: one
 *                     `RetryPolicy`).
 */
import type { RetryPolicy } from "@stackra/contracts";

/** The options of a listener. */
export interface ListenerOptions {
  /** The worker queue that runs it (`Queues.Default`). */
  readonly queue?: string;

  /**
   * How a failed delivery is retried on that queue: the shared `RetryPolicy` (`base` is the first wait, which was
   * `ListenerRetry.backoff` before stackra-223); the queue driver applies it.
   */
  readonly retry?: RetryPolicy;
}
