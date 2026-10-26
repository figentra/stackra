/**
 * Stackra file contract:
 * Purpose: `SendWebhooksListener`, the fan-out of outbound webhooks: for each `webhook: true` integration event it
 *          finds the enabled receivers of the event's scope node subscribed to its wire name (through the
 *          `WebhookEndpointStore`, this package's table or a host's own) and queues one delivery job per receiver with
 *          the body every attempt posts.
 * Boundary: subscribed to each outbound event by `registerOutboundWebhooks`, not by its `handle` parameter type, which
 *           is the event base. An endpoint receives the events of its own scope node; a platform event (no scope)
 *           goes to no endpoint. The body is `{ type, timestamp, data }`: the wire name, the occurrence time and the
 *           event's fields. Each job's Idempotency-Key is the event id and the endpoint id, so a redelivered event
 *           replays its jobs instead of posting twice.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 1 and 3); ADR 0078 (decision 4); ADR 0294 (decision 4); ADR 0327 (decision
 *                     3).
 */
import { Listener, type Event, type EventClass, type ListenerContext } from "@stackra/events";
import type { QueueService } from "@stackra/queue";

import type { WebhookEndpointStore } from "#contracts/index";
import { webhookBody } from "#core/index";
import { DeliverWebhookAction } from "#node/actions/deliver-webhook.action";
import { OUTBOUND_EVENTS } from "#node/constants/outbound-events.constant";

/** Queues the deliveries of one outbound event. */
export class SendWebhooksListener extends Listener {
  /** Finds the subscribed receivers. */
  private readonly endpoints: WebhookEndpointStore;

  /** Queues the delivery jobs. */
  private readonly queue: QueueService;

  /**
   * @param endpoints - the endpoint store.
   * @param queue - the queue service.
   */
  constructor(endpoints: WebhookEndpointStore, queue: QueueService) {
    super();
    this.endpoints = endpoints;
    this.queue = queue;
  }

  /** Queues one delivery per subscribed endpoint of the event's scope node. */
  async handle(event: Event, ctx: ListenerContext): Promise<void> {
    const type = OUTBOUND_EVENTS.get(event.constructor as EventClass);
    // the event's scope node: the ADR 0141 envelope still names its field `tenantId`
    const scopeId = ctx.tenantId;
    if (type === undefined || scopeId === undefined) return;
    const endpoints = await this.endpoints.subscribedTo(scopeId, type);
    if (endpoints.length === 0) return;
    const body = webhookBody(type, ctx.occurredAt, event);
    await Promise.all(
      endpoints.map((endpoint) =>
        this.queue.push(
          DeliverWebhookAction,
          { endpointId: endpoint.id, eventId: ctx.eventId, type, body },
          {
            scope: endpoint.scope,
            idempotencyKey: `${ctx.eventId}:${endpoint.id}`,
          },
        ),
      ),
    );
  }
}
