/**
 * Stackra file contract:
 * Purpose: `WebhookEventIdPart`, one part of an inbound webhook's event id when the provider sends none of its own: a
 *          payload path (`orderId`, `payload.state`) or a request header (`x-quiqup-timestamp`).
 * Boundary: a type only; exactly one of `path` and `header` is set (`readIntegrationOptions` checks it).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 20: an inbound event is deduplicated by its id).
 */

/**
 * One part of a composite event id.
 *
 * @example
 * const parts: WebhookEventIdPart[] = [{ path: "order.id" }, { path: "payload.state" }, { header: "x-quiqup-timestamp" }];
 */
export interface WebhookEventIdPart {
  /** A dotted path in the parsed payload whose string or number value is the part. */
  readonly path?: string;

  /** A request header whose value is the part (lower case). */
  readonly header?: string;
}
