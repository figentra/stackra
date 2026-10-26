/**
 * Stackra file contract:
 * Purpose: `DELIVER_WEBHOOK_INPUT_SCHEMA`, the zod schema this package ships for `DeliverWebhookInput`: the receiver's id
 *          in its `WebhookEndpointStore` (`whe_…` here, a host's own id there), the event's id and wire name, and the JSON body.
 * Boundary: the stand-in for what gen writes for this package; the pipeline checks each job's stored input with it
 *           before an attempt runs. Whether the endpoint still exists is the action's check.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0095 as amended.
 */
import { z } from "zod";

/** The shipped `DeliverWebhookInput$`. */
export const DELIVER_WEBHOOK_INPUT_SCHEMA = z.object({
  endpointId: z.string().min(1).max(64),
  eventId: z.string().min(1).max(64),
  type: z.string().min(1).max(200),
  body: z.string().min(2),
});
