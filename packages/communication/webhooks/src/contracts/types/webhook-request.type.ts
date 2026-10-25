/**
 * Stackra file contract:
 * Purpose: `WebhookRequest`, one signed outbound delivery as a `WebhookSender` posts it: the endpoint's URL, the
 *          Standard Webhooks headers and the exact body they sign.
 * Boundary: a type only, in the leaf entry. The body is the string that was signed, sent byte for byte; the headers
 *           carry signatures, never a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decisions 2 and 3); the Standard Webhooks specification.
 */

/** One delivery to post. */
export interface WebhookRequest {
  /** The endpoint's https URL. */
  readonly url: string;

  /** `webhook-id`, `webhook-timestamp`, `webhook-signature` and `content-type`. */
  readonly headers: Readonly<Record<string, string>>;

  /** The JSON body, exactly as signed. */
  readonly body: string;

  /** Aborts the request when the delivery job's attempt times out. */
  readonly signal?: AbortSignal;
}
