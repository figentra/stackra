/**
 * Stackra file contract:
 * Purpose: unit tests of `SendWebhooksListener`: an outbound event of a scope node queues one delivery job per
 *          subscribed endpoint, with the `{ type, timestamp, data }` body, the endpoint's scope and an Idempotency-Key of
 *          the event and the endpoint; an event with no scope, an event that is not outbound and a scope with no
 *          subscribed endpoint queue nothing.
 * Boundary: test only; the endpoint service and the queue are in-test fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decisions 1 and 3); ADR 0078 (decision 4).
 */
import { IntegrationEvent, type ListenerContext } from "@stackra/events";
import type { QueueService } from "@stackra/queue";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { DeliverWebhookAction } from "#node/actions/deliver-webhook.action";
import { OUTBOUND_EVENTS } from "#node/constants/outbound-events.constant";
import { SendWebhooksListener } from "#node/listeners/send-webhooks.listener";
import { WebhookEndpoint } from "#node/models/webhook-endpoint.model";
import type { WebhookEndpointService } from "#node/services/webhook-endpoint.service";

class InvoicePaid extends IntegrationEvent({ name: "invoice.paid", webhook: true }) {
  invoiceId!: string;
}

class InvoiceDrafted extends IntegrationEvent({ name: "invoice.drafted" }) {
  invoiceId!: string;
}

registerSchemas([
  [InvoicePaid, z.object({ invoiceId: z.string() })],
  [InvoiceDrafted, z.object({ invoiceId: z.string() })],
]);
OUTBOUND_EVENTS.set(InvoicePaid, "billing.invoice.paid.v1");

const SCOPE = { id: "scp_00000000000000000000000001", path: "platform.acme" } as const;
const OCCURRED = new Date("2026-10-25T09:00:00Z");

/** A stored endpoint of the test scope. */
const endpointOf = (): WebhookEndpoint =>
  Object.assign(new WebhookEndpoint(), {
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    url: "https://hooks.acme.example/in",
    events: ["billing.invoice.paid.v1"],
  });

/** A listener whose endpoint service answers `endpoints`. */
function setup(endpoints: WebhookEndpoint[]) {
  const service = { subscribedTo: vi.fn(async () => endpoints) };
  const queue = { push: vi.fn(async () => "job_00000000000000000000000001") };
  const listener = new SendWebhooksListener(
    service as unknown as WebhookEndpointService,
    queue as unknown as QueueService,
  );
  return { listener, service, queue };
}

/** The context of an occurrence in `tenantId`'s scope node (the envelope's field name). */
const contextOf = (tenantId?: string) =>
  ({
    eventId: "evt_1",
    occurredAt: OCCURRED,
    ...(tenantId === undefined ? {} : { tenantId }),
    now: () => OCCURRED,
  }) as ListenerContext;

describe(SendWebhooksListener, () => {
  it("queues one delivery per subscribed endpoint of the event's scope node", async () => {
    const first = endpointOf();
    const second = endpointOf();
    const { listener, service, queue } = setup([first, second]);
    await listener.handle(InvoicePaid.create({ invoiceId: "inv_1" }), contextOf(SCOPE.id));
    expect(service.subscribedTo).toHaveBeenCalledWith(SCOPE.id, "billing.invoice.paid.v1");
    const body = JSON.stringify({
      type: "billing.invoice.paid.v1",
      timestamp: OCCURRED.toISOString(),
      data: { invoiceId: "inv_1" },
    });
    expect(queue.push).toHaveBeenCalledTimes(2);
    expect(queue.push).toHaveBeenCalledWith(
      DeliverWebhookAction,
      { endpointId: first.id, eventId: "evt_1", type: "billing.invoice.paid.v1", body },
      { scope: SCOPE, idempotencyKey: `evt_1:${first.id}` },
    );
    expect(queue.push).toHaveBeenCalledWith(
      DeliverWebhookAction,
      expect.objectContaining({ endpointId: second.id }),
      expect.objectContaining({ idempotencyKey: `evt_1:${second.id}` }),
    );
  });

  it("queues nothing for an event with no scope, an event that is not outbound, or no subscriber", async () => {
    const platform = setup([endpointOf()]);
    await platform.listener.handle(InvoicePaid.create({ invoiceId: "inv_1" }), contextOf());
    expect(platform.service.subscribedTo).not.toHaveBeenCalled();
    const inner = setup([endpointOf()]);
    await inner.listener.handle(InvoiceDrafted.create({ invoiceId: "inv_1" }), contextOf(SCOPE.id));
    expect(inner.service.subscribedTo).not.toHaveBeenCalled();
    const none = setup([]);
    await none.listener.handle(InvoicePaid.create({ invoiceId: "inv_1" }), contextOf(SCOPE.id));
    expect(none.queue.push).not.toHaveBeenCalled();
  });
});
