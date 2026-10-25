/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryBrokerPublisherDriver`: it is the `BrokerPublisher` port; it keeps what was published
 *          per topic, delivers a copy to each subscriber after `publish` resolves, skips a throwing handler, and stops
 *          delivering after unsubscribe.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0148 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { BrokerPublisher } from "#contracts/index";
import type { BrokerMessage } from "#contracts/index";
import { MemoryBrokerPublisherDriver } from "#core/drivers/memory-broker-publisher.driver";

/** Lets queued microtasks and promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe(MemoryBrokerPublisherDriver, () => {
  it("is a BrokerPublisher that keeps what was published", async () => {
    const broker = new MemoryBrokerPublisherDriver();
    expect(broker).toBeInstanceOf(BrokerPublisher);
    await broker.publish("t", { id: "m1", body: { a: 1 } });
    expect(broker.published.get("t")).toEqual([{ id: "m1", body: { a: 1 } }]);
  });

  it("delivers a copy after publish, skips a throwing handler, and unsubscribes", async () => {
    const broker = new MemoryBrokerPublisherDriver();
    const seen: BrokerMessage[] = [];
    const body = { a: 1 };
    broker.subscribe("t", () => {
      throw new Error("handler failed");
    });
    const stop = broker.subscribe("t", (message) => seen.push(message));
    await broker.publish("t", { id: "m1", body });
    expect(seen).toEqual([]);
    await settle();
    expect(seen).toEqual([{ id: "m1", body: { a: 1 } }]);
    expect(seen[0]?.body).not.toBe(body);
    stop();
    await broker.publish("t", { id: "m2", body });
    await settle();
    expect(seen).toHaveLength(1);
  });
});
