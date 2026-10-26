/**
 * Stackra file contract:
 * Purpose: the memory driver of the `BrokerPublisher` port (driver name `memory`, the default): an in-process broker
 *          that delivers each message to the handlers subscribed to its topic and keeps what was published, for tests
 *          and a single process.
 * Boundary: one process only and nothing survives a restart. Delivery is after `publish` resolves (a microtask), so a
 *           publisher never runs a subscriber inside its own transaction; a handler that throws is skipped, never the
 *           publish. The body is copied through JSON, as a real broker would, so a subscriber never shares an object
 *           with the publisher.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver before the production one); ADR 0148 (decision 3).
 */
import { Driver } from "@stackra/container";

import { BrokerPublisher } from "#contracts/index";
import type { BrokerMessage } from "#contracts/index";

/**
 * A broker in process memory.
 *
 * @example
 * broker.subscribe("orders.order.paid.v1", (message) => inbox.receive(message.body as EventEnvelope));
 */
export class MemoryBrokerPublisherDriver extends Driver(BrokerPublisher) {
  /** What was published, per topic, in order. */
  readonly published = new Map<string, BrokerMessage[]>();

  private readonly handlers = new Map<string, Set<(message: BrokerMessage) => unknown>>();

  /** Hands `message` to `topic`, resolving once it is held. */
  publish(topic: string, message: BrokerMessage): Promise<void> {
    const copy: BrokerMessage = Object.freeze({
      id: message.id,
      body: JSON.parse(JSON.stringify(message.body ?? null)) as unknown,
    });
    const list = this.published.get(topic) ?? [];
    list.push(copy);
    this.published.set(topic, list);
    for (const handler of this.handlers.get(topic) ?? [])
      queueMicrotask(() => {
        void Promise.resolve()
          .then(() => handler(copy))
          .catch(() => undefined);
      });
    return Promise.resolve();
  }

  /**
   * Delivers every later message of `topic` to `handler`.
   *
   * @returns removes the handler.
   */
  subscribe(topic: string, handler: (message: BrokerMessage) => unknown): () => void {
    const set = this.handlers.get(topic) ?? new Set();
    set.add(handler);
    this.handlers.set(topic, set);
    return () => {
      set.delete(handler);
    };
  }
}
