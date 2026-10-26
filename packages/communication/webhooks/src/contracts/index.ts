/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/webhooks (the `WebhookSender` port and the
 *          `WebhookRequest` it posts, the `WebhookObjectSink` port and the `WebhookObject` it writes to an S3 target,
 *          and the `WebhookEntitlementSource` port) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { WebhookEntitlementSource } from "#contracts/ports/webhook-entitlement-source.port";
export { WebhookObjectSink } from "#contracts/ports/webhook-object-sink.port";
export { WebhookSender } from "#contracts/ports/webhook-sender.port";
export type { WebhookObject } from "#contracts/types/webhook-object.type";
export type { WebhookRequest } from "#contracts/types/webhook-request.type";
