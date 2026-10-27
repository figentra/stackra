/**
 * Stackra file contract:
 * Purpose: `RetryPolicy`, the one retry shape of Stackra: how many attempts, the first wait and the longest one, the
 *          curve between them, the jitter and which failures retry. Queue jobs, the outbox, workflow steps, listeners,
 *          the transport's `retry` middleware, public clients, Integrations, realtime and collaboration reconnects and
 *          lock waits all speak it.
 * Boundary: a type only; `backoffDelay` reads the wait part. Every field but `attempts` falls back to its caller's
 *           default (a frozen constant in that package), so a caller states only what it changes. A caller that
 *           reads only some fields takes `Pick<RetryPolicy, …>`, never a shape of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: retries with backoff and jitter); ADR 0140 (decision 3: retryable kinds);
 *                     owner D10 2026-10-28 (stackra-223: one retry policy).
 */
import type { Duration } from "#core/constants/duration.constant";
import type { Backoff } from "#core/enums/backoff.enum";
import type { Jitter } from "#core/enums/jitter.enum";
import type { RetryOn } from "#core/enums/retry-on.enum";

/**
 * How a failed call, job or connection is tried again.
 *
 * @example
 * retry: { attempts: 5, base: Duration.parse("200ms"), max: Duration.seconds(30), jitter: Jitter.Equal }
 */
export interface RetryPolicy {
  /** Attempts in all, the first included: a whole number from 1. */
  readonly attempts: number;

  /** The first wait; the caller's default when absent. */
  readonly base?: Duration;

  /** The longest single wait; the caller's default when absent. */
  readonly max?: Duration;

  /** How the wait grows from `base`; `Backoff.Exponential` when absent. */
  readonly backoff?: Backoff;

  /** The growth factor of `Backoff.Exponential`; 2 when absent. */
  readonly multiplier?: number;

  /** How the wait is spread; `Jitter.None` when absent. */
  readonly jitter?: Jitter;

  /** Which failures retry; `RetryOn.Retryable` when absent. */
  readonly retryOn?: RetryOn;
}
