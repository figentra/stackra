/**
 * Stackra file contract:
 * Purpose: `RetryPolicy`, an Integration's `retry` option: how the managed client retries a call the provider did not
 *          answer, timed out, rate limited or failed with a 5xx.
 * Boundary: a type only. A `GET`, `HEAD`, `PUT` or `DELETE` retries; a `POST` or `PATCH` retries only when the call
 *           passes an idempotency key and the provider names its idempotency header, so a retried call never acts
 *           twice. After the last attempt the client throws the retryable `ProviderUnavailableError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13: the Integration declares its retry policy).
 */
import type { Interval } from "#core/types/interval.type";

/**
 * How the managed client retries.
 *
 * @example
 * retry: { idempotencyHeader: "Idempotency-Key" }
 */
export interface RetryPolicy {
  /** The header the provider deduplicates on; a call's `idempotencyKey` is sent in it. */
  readonly idempotencyHeader?: string;

  /** Attempts in all, the first included; 3 when left out. */
  readonly attempts?: number;

  /** The first backoff, doubled for each later attempt; `"200ms"` when left out. A `Retry-After` answer wins. */
  readonly backoff?: Interval;

  /** The longest single wait, for a backoff or a full rate-limit bucket; `"30s"` when left out. */
  readonly maxDelay?: Interval;
}
