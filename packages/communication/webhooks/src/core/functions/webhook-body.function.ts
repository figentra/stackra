/**
 * Stackra file contract:
 * Purpose: `webhookBody`, the outbound delivery body `{ type, timestamp, data }`: the wire name, the occurrence time and
 *          the event's fields, as the JSON every attempt signs and posts.
 * Boundary: pure. Built once, when the delivery is queued, so every retry sends the same bytes; a host that queues its
 *           own deliveries (a partner lead) builds the body here so receivers see one shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3); the Standard Webhooks specification (payload structure).
 */

/**
 * The JSON body of one outbound event.
 *
 * @example
 * webhookBody("registry.lead.submitted.v1", ctx.occurredAt, { perkId, fields });
 */
export function webhookBody(type: string, occurredAt: Date, data: unknown): string {
  return JSON.stringify({ type, timestamp: occurredAt.toISOString(), data });
}
