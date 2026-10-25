/**
 * Stackra file contract:
 * Purpose: `WebhookMessage`, what `signWebhook` signs: the message id (the receiver's dedup key), the send time and
 *          the exact body.
 * Boundary: a type only. The id stays the same across the retries of one delivery; the timestamp is each attempt's, so
 *           the receiver's tolerance window holds on a retry three days later.
 * Runtime: isomorphic
 * Governing contract: the Standard Webhooks specification; ADR 0224 (decision 2).
 */

/** One message to sign. */
export interface WebhookMessage {
  /** The message id, sent as `webhook-id` (the event id of an outbound delivery). */
  readonly id: string;

  /** When it is sent, sent as `webhook-timestamp` in whole seconds. */
  readonly timestamp: Date;

  /** The body, exactly as it will be sent. */
  readonly body: string;
}
