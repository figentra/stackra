/**
 * Stackra file contract:
 * Purpose: `ProviderUnavailableError` (`provider_unavailable`), the refusal the managed client throws once its retries
 *          are spent on a provider that did not answer, timed out, rate limited it or failed with a 5xx, when a
 *          rate-limit bucket stays full past the longest wait, and when it sheds the call without sending it: the
 *          provider's circuit is open (it kept failing) or its concurrency bulkhead is full (STA-1467).
 * Boundary: kind `Unavailable`, retryable, so a queued job retries and finally dead-letters. Its details are the
 *           provider, the last status when there was one, the wait the bucket or the open circuit asked for, and the
 *           `reason` when it is one of the client's own (a timeout, an open circuit, a full bulkhead), never a
 *           credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); ADR 0140 (envelope and kinds); ADR 0148 (retries and dead letters);
 *                     STA-1467 (timeouts, circuit breaker and bulkhead).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The provider is not answering; the same call may succeed later. */
export class ProviderUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The provider's code (`resend`). */
  provider!: string;

  /** The last HTTP status, when the provider answered at all. */
  status?: number;

  /** How long the provider's rate limit, or its open circuit, asked to wait, in milliseconds. */
  retryAfterMs?: number;

  /**
   * Why the client gave up on its own: `timeout` (the last attempt passed the Integration's `timeout`),
   * `circuit_open` (the provider kept failing, so the call was not sent) or `bulkhead_full` (the provider's
   * `concurrency` was taken, so the call was not sent); absent when the provider's own answer, or none, decided.
   */
  reason?: "timeout" | "circuit_open" | "bulkhead_full";
}
