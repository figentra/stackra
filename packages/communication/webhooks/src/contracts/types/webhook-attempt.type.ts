/**
 * Stackra file contract:
 * Purpose: `WebhookAttempt`, one delivery attempt as the delivery job hands it to the `WebhookDeliveryLog`: which
 *          receiver, which event, the answer and whether it was accepted.
 * Boundary: a type only, in the leaf entry. It holds no body, no header and no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3: deliveries are shown with replay).
 */
import type { ScopeRef } from "@stackra/contracts";

/** One attempt to deliver one event to one receiver. */
export interface WebhookAttempt {
  /** The receiver's id (`WebhookTarget.id`). */
  readonly endpointId: string;

  /** The receiver's scope node. */
  readonly scope: ScopeRef;

  /** The event's id, sent as `webhook-id`. */
  readonly eventId: string;

  /** The event's wire name (`orders.order.paid.v1`). */
  readonly eventType: string;

  /** The HTTP status; `null` when there was no answer, or the target is an S3 object. */
  readonly responseStatus: number | null;

  /** Whether the receiver accepted it (a 2xx, or a written object). */
  readonly isDelivered: boolean;
}
