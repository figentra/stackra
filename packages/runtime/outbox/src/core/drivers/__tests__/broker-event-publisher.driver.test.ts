/**
 * Stackra file contract:
 * Purpose: unit tests of `BrokerEventPublisherDriver`: it is the `EventPublisher` port and publishes each envelope to
 *          the topic of its wire name with the event id as message id, passing a broker rejection to the relay.
 * Boundary: test only; @stackra/queue's memory broker stands in for the broker.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (decision 1); ADR 0148 (decision 3).
 */
import { MemoryBrokerPublisherDriver } from "@stackra/queue";
import { describe, expect, it } from "@stackra/testing";

import { EventPublisher } from "#contracts/index";
import type { EventEnvelope } from "#contracts/index";
import { BrokerEventPublisherDriver } from "#core/drivers/broker-event-publisher.driver";

const ENVELOPE: EventEnvelope = {
  id: "evt_01j9z3k4m5n6p7q8r9s0t1v2w3",
  type: "orders.order.paid.v1",
  occurredAt: "2026-10-25T09:00:00.000Z",
  meta: {},
  data: { orderId: "ord_1" },
};

describe(BrokerEventPublisherDriver, () => {
  it("publishes the envelope to the topic of its wire name", async () => {
    const broker = new MemoryBrokerPublisherDriver();
    const publisher = new BrokerEventPublisherDriver(broker);
    expect(publisher).toBeInstanceOf(EventPublisher);
    await publisher.publish(ENVELOPE);
    expect(broker.published.get("orders.order.paid.v1")).toEqual([
      { id: ENVELOPE.id, body: ENVELOPE },
    ]);
  });

  it("passes a broker rejection on", async () => {
    const broker = new MemoryBrokerPublisherDriver();
    broker.publish = () => Promise.reject(new Error("broker down"));
    await expect(new BrokerEventPublisherDriver(broker).publish(ENVELOPE)).rejects.toThrow(
      "broker down",
    );
  });
});
