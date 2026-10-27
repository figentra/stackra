/**
 * Stackra file contract:
 * Purpose: the `model` `WebhookDeliveryLog`: each attempt as a `WebhookDelivery` row of `webhooks.webhook_deliveries`,
 *          written through `WebhookDeliveryService.record` in a transaction of its own.
 * Boundary: the default log; a service with its own delivery tables binds its own driver instead.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 3); ADR 0142 (drivers behind ports).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { WebhookDeliveryLog } from "#contracts/index";
import type { WebhookAttempt } from "#contracts/index";
import type { WebhookDeliveryService } from "#node/services/webhook-delivery.service";

/**
 * Logs attempts as `WebhookDelivery` rows.
 *
 * @example
 * await new ModelWebhookDeliveryLogDriver(deliveries).record(attempt);
 */
export class ModelWebhookDeliveryLogDriver extends Driver(WebhookDeliveryLog) {
  /** The delivery log service. */
  private readonly deliveries: WebhookDeliveryService;

  /**
   * @param deliveries - the delivery log service.
   */
  constructor(deliveries: WebhookDeliveryService) {
    super();
    this.deliveries = deliveries;
  }

  /** Implements `WebhookDeliveryLog.record`, documented there. */
  async record(attempt: WebhookAttempt): Promise<void> {
    const { scope, endpointId, ...rest } = attempt;
    await this.deliveries.record({
      ...rest,
      endpointId: endpointId as PublicId<"whe">,
      scopeId: scope.id,
      scopePath: scope.path,
    });
  }
}
