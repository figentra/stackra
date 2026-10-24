/**
 * Stackra file contract:
 * Purpose: `RetryOptions`, what `retry` takes: how many attempts, which failures count, and how long to wait.
 * Boundary: a type only. Whatever the options say, a request that is not safe to repeat is sent once.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (retryable kinds); ADR 0138 (idempotency).
 */
import type { Duration } from "@stackra/contracts";

/** The retry policy of one transport. */
export interface RetryOptions {
  /** Attempts in all, the first one included; a whole number of at least 1. */
  readonly attempts: number;

  /** Retry a fetch failure (a network error) or a `RequestTimedOutError`. Default `true`. */
  readonly network?: boolean;

  /** Retry a response whose status is that of a retryable `ErrorKind` (429, 503). Default `true`. */
  readonly refused?: boolean;

  /** The wait before attempt `attempt + 1` when the response names none; default 200 ms doubling, at most 5 s. */
  readonly delay?: (attempt: number) => Duration;

  /** A `Retry-After` longer than this returns the refused response instead of waiting. Default 30 seconds. */
  readonly maxWait?: Duration;
}
