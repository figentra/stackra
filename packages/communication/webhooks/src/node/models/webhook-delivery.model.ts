/**
 * Stackra file contract:
 * Purpose: `WebhookDelivery`, the delivery log: one row per attempt to deliver one event to one endpoint, with the
 *          event's id and wire name, the endpoint's answer and whether it was accepted.
 * Boundary: data only, append-only by use. Key `webhooks.webhook_delivery`, table `webhooks.webhook_deliveries`. It holds
 *           no body, no header and no secret: the body lives in the queue job until it ends (a dead letter keeps it
 *           for a redrive). `createdAt` is when the attempt was made. Rows are written through
 *           `WebhookDeliveryService.record`, never with `new`.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 3: deliveries shown with replay and a dead-letter queue); ADR 0327 (decisions
 *                     3 and 9); ADR 0294 (decisions 4, 11, 20 and 27).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** One delivery attempt. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class WebhookDelivery extends Model.with(HasPublicId("whd"), Timestamps) {
  /** The endpoint the attempt was sent to. */
  endpointId!: PublicId<"whe">;

  /** The endpoint's scope node. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for a subtree's delivery list. */
  scopePath!: string;

  /** The event's id, sent as `webhook-id`: the receiver's dedup key. */
  eventId!: string;

  /** The event's wire name (`orders.order.paid.v1`). */
  eventType!: string;

  /** The endpoint's HTTP status; `null` when it did not answer. */
  responseStatus!: number | null;

  /** Whether the endpoint answered with a 2xx. */
  isDelivered!: boolean;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface WebhookDelivery {
  [OptionalProps]?: "createdAt" | "updatedAt";
}
