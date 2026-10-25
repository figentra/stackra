/**
 * Stackra file contract:
 * Purpose: unit tests of `registerOutboundWebhooks`: a `webhook: true` integration event is recorded with its wire name
 *          and `SendWebhooksListener` is subscribed to it; an event that is not one, or a row without a wire name, is
 *          refused.
 * Boundary: test only; the registries are process-wide, so each case declares its own events.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decision 1); ADR 0141.
 */
import { DomainEvent, IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

const { registerListeners } = vi.hoisted(() => ({ registerListeners: vi.fn() }));

vi.mock("@stackra/events", async (original) => ({
  ...(await original<typeof import("@stackra/events")>()),
  registerListeners,
}));

import { OUTBOUND_EVENTS } from "#node/constants/outbound-events.constant";
import { registerOutboundWebhooks } from "#node/functions/register-outbound-webhooks.function";
import { SendWebhooksListener } from "#node/listeners/send-webhooks.listener";

class OrderPaid extends IntegrationEvent({ name: "order.paid", webhook: true }) {}

class OrderPlaced extends IntegrationEvent({ name: "order.placed" }) {}

class StockReserved extends DomainEvent {}

describe(registerOutboundWebhooks, () => {
  it("records the wire name and subscribes the fan-out listener", () => {
    registerOutboundWebhooks([{ type: OrderPaid, name: "orders.order.paid.v1" }]);
    expect(OUTBOUND_EVENTS.get(OrderPaid)).toBe("orders.order.paid.v1");
    expect(registerListeners).toHaveBeenCalledWith([[OrderPaid, SendWebhooksListener]]);
  });

  it("refuses an event that never leaves as a webhook and a row without a wire name", () => {
    expect(() =>
      registerOutboundWebhooks([{ type: OrderPlaced, name: "orders.order.placed.v1" }]),
    ).toThrow("is not an integration event with webhook: true");
    expect(() =>
      registerOutboundWebhooks([{ type: StockReserved, name: "orders.stock.reserved.v1" }]),
    ).toThrow(TypeError);
    expect(() => registerOutboundWebhooks([{ type: OrderPaid, name: "" }])).toThrow(
      "needs its locked wire name",
    );
  });
});
