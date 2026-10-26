/**
 * Stackra file contract:
 * Purpose: `WebhookAttemptOutcome`, what one `attemptWebhook` call reports: the HTTP status, whether the receiver
 *          accepted it, and why not.
 * Boundary: a type only. The cause is the transport's error (no answer, a refused object write); it never carries a
 *           secret, because the transports never see one.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3).
 */

/** The result of one delivery attempt. */
export interface WebhookAttemptOutcome {
  /** The HTTP status; `null` when there was no answer, or the target is an S3 object. */
  readonly status: number | null;

  /** Whether the receiver accepted it: a 2xx (a redirect is not), or a written object. */
  readonly isDelivered: boolean;

  /** The transport's error when it threw; absent otherwise. */
  readonly cause?: unknown;
}
