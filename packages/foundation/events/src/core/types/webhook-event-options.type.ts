/**
 * Stackra file contract:
 * Purpose: `WebhookEventOptions`, what `WebhookEvent<I>({...})` takes: only the provider's event type.
 * Boundary: a type only. Verification and routing are declared once on the Integration named by the type argument;
 *           the retired path form (`{ path, scheme, secret }`) is not accepted.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); ADR 0305 (rules 19 and 45).
 */

/** The options of a webhook event. */
export interface WebhookEventOptions {
  /** The provider's event type, as its payload names it (`email.received`). */
  readonly type: string;
}
