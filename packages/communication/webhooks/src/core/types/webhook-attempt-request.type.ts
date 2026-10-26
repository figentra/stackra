/**
 * Stackra file contract:
 * Purpose: `WebhookAttemptRequest`, the input of `attemptWebhook`: where to deliver (an https URL or an `s3:` target),
 *          the event's id and wire name, the exact body, the secrets to sign with, the attempt's time and its abort
 *          signal.
 * Boundary: a type only, held in memory for one attempt. The secrets are values read just before the call; never put
 *           this object in a job input, a log or an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decisions 2 and 3); ADR 0173; ADR 0422 (decision 4).
 */

/** One event for one receiver, ready to sign. */
export interface WebhookAttemptRequest {
  /** The receiver's https URL or `s3://bucket/prefix?region=…` target. */
  readonly url: string;

  /** The event's id, sent as `webhook-id` on every attempt. */
  readonly eventId: string;

  /** The event's wire name (`registry.lead.submitted.v1`); part of an object key. */
  readonly type: string;

  /** The exact JSON body to sign and deliver (`webhookBody`). */
  readonly body: string;

  /** The secret values to sign with, current first. */
  readonly secrets: readonly string[];

  /** The attempt's time: the `webhook-timestamp`. */
  readonly now: Date;

  /** Aborts the post or the write. */
  readonly signal?: AbortSignal;
}
