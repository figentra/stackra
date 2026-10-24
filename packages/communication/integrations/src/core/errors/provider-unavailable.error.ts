/**
 * Stackra file contract:
 * Purpose: `ProviderUnavailableError` (`provider_unavailable`), the refusal the managed client throws once its retries
 *          are spent on a provider that did not answer, timed out, rate limited it or failed with a 5xx, and when a
 *          rate-limit bucket stays full past the longest wait.
 * Boundary: kind `Unavailable`, retryable, so a queued job retries and finally dead-letters. Its details are the
 *           provider, the last status when there was one and the wait the bucket asked for, never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); ADR 0140 (envelope and kinds); ADR 0148 (retries and dead letters).
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

  /** How long the provider's rate limit asked to wait, in milliseconds. */
  retryAfterMs?: number;
}
