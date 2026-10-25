/**
 * Stackra file contract:
 * Purpose: `WebhookHeaders`, the three Standard Webhooks headers `signWebhook` returns and a receiver checks.
 * Boundary: a type only. `webhook-signature` holds one `v1,<base64>` per signing secret, separated by spaces, so a
 *           receiver holding either secret of a rotation verifies.
 * Runtime: isomorphic
 * Governing contract: the Standard Webhooks specification; ADR 0224 (decision 2); ADR 0308 (rule 17).
 */

/** The signed headers of one message. */
export interface WebhookHeaders {
  /** The message id. */
  readonly "webhook-id": string;

  /** The send time in whole Unix seconds. */
  readonly "webhook-timestamp": string;

  /** `v1,<base64 HMAC-SHA256>` per secret, space-separated. */
  readonly "webhook-signature": string;
}
