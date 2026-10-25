/**
 * Stackra file contract:
 * Purpose: `WebhookDeliveryService`, the module service over the delivery log: records one attempt.
 * Boundary: a `CrudService<WebhookDelivery>`. An attempt is written in a transaction of its own, so a failed attempt
 *           stays in the log when the delivery job's unit of work rolls back to be retried.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 3); ADR 0105 as amended by ADR 0294.
 */
import { CrudService } from "@stackra/database";

import type { WebhookDelivery } from "#node/models/webhook-delivery.model";

/**
 * Records delivery attempts.
 *
 * @example
 * await deliveries.record({ endpointId, scopeId, scopePath, eventId, eventType, responseStatus: 500, isDelivered: false });
 */
export class WebhookDeliveryService extends CrudService<WebhookDelivery> {
  /** Stores `attempt` in its own transaction. */
  record(
    attempt: Pick<
      WebhookDelivery,
      | "endpointId"
      | "scopeId"
      | "scopePath"
      | "eventId"
      | "eventType"
      | "responseStatus"
      | "isDelivered"
    >,
  ): Promise<WebhookDelivery> {
    return this.insert({ ...attempt }, { requiresNew: true });
  }
}
