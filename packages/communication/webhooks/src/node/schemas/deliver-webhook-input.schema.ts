/**
 * Stackra file contract:
 * Purpose: `DeliverWebhookInput`, the input of the `webhook_delivery.send` job: which endpoint, which event (its id and
 *          wire name) and the exact JSON body to sign and post.
 * Boundary: a shape class in schemas/, one declaration per file; it registers this package's own schema
 *           (`DELIVER_WEBHOOK_INPUT_SCHEMA`) when the module loads. The body is fixed when the job is queued, so every
 *           retry posts the same bytes; it holds the event's payload, never a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (Input and Output in their own files); ADR 0224
 *                     (decision 3).
 */
import type { PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { DELIVER_WEBHOOK_INPUT_SCHEMA } from "#node/constants/deliver-webhook-input-schema.constant";

/** One event for one endpoint. */
export class DeliverWebhookInput extends Schema {
  /** The endpoint to post to. */
  endpointId!: PublicId<"whe">;

  /** The event's id, sent as `webhook-id` on every attempt. */
  eventId!: string;

  /** The event's wire name (`orders.order.paid.v1`). */
  type!: string;

  /** `{ "type", "timestamp", "data" }` as JSON, exactly as signed and posted. */
  body!: string;
}

registerSchemas([[DeliverWebhookInput, DELIVER_WEBHOOK_INPUT_SCHEMA]]);
