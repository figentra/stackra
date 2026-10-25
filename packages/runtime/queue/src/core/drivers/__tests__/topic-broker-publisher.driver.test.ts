/**
 * Stackra file contract:
 * Purpose: unit tests of `TopicBrokerPublisherDriver` and `registerBrokerTopics`: a message goes to the topic
 *          registered under its name; an unregistered name rejects; a second topic under one name, an empty name or a
 *          topic without `publish` is refused at registration.
 * Boundary: test only; the topics are plain objects standing in for generated Encore topics.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 3 and 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BrokerPublisher } from "#contracts/index";
import { TopicBrokerPublisherDriver } from "#core/drivers/topic-broker-publisher.driver";
import { registerBrokerTopics } from "#core/functions/register-broker-topics.function";
import type { BrokerTopic } from "#core/types/broker-topic.type";

describe(TopicBrokerPublisherDriver, () => {
  it("publishes to the registered topic", async () => {
    const topic = { publish: vi.fn(async () => "msg-1") };
    registerBrokerTopics([{ name: "orders.order.paid.v1", topic }]);
    registerBrokerTopics([{ name: "orders.order.paid.v1", topic }]);
    const broker = new TopicBrokerPublisherDriver();
    expect(broker).toBeInstanceOf(BrokerPublisher);
    await broker.publish("orders.order.paid.v1", { id: "evt_1", body: { a: 1 } });
    expect(topic.publish).toHaveBeenCalledWith({ id: "evt_1", body: { a: 1 } });
    await expect(broker.publish("nope.v1", { id: "evt_2", body: null })).rejects.toThrow(TypeError);
  });

  it("refuses a bad registration", () => {
    const topic = { publish: async () => undefined };
    registerBrokerTopics([{ name: "a.v1", topic }]);
    expect(() =>
      registerBrokerTopics([{ name: "a.v1", topic: { publish: async () => 1 } }]),
    ).toThrow(TypeError);
    expect(() => registerBrokerTopics([{ name: "", topic }])).toThrow(TypeError);
    expect(() => registerBrokerTopics([{ name: "b.v1", topic: {} as BrokerTopic }])).toThrow(
      TypeError,
    );
  });
});
