/**
 * Stackra file contract:
 * Purpose: `registerBrokerTopics`, how gen's generated entry hands the broker topics it emitted (Encore `Topic`s in
 *          SaaS) to the `topic` broker publisher, each under the name it is published by.
 * Boundary: writes the process-wide `BROKER_TOPICS`; a name registered again with the same topic does nothing, with
 *           another topic it is refused, so two generated topics never answer to one name.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 3 and 6); ADR 0294 (decision 22); the queue precedent (`registerJobs`).
 */
import { BROKER_TOPICS } from "#core/constants/broker-topics.constant";
import type { BrokerTopic } from "#core/types/broker-topic.type";

/**
 * Registers broker topics by name.
 *
 * @throws TypeError when a name is empty, a topic has no `publish`, or another topic has the name.
 * @example
 * registerBrokerTopics([{ name: "orders.order.paid.v1", topic: orderPaidTopic }]);
 */
export function registerBrokerTopics(
  rows: readonly { readonly name: string; readonly topic: BrokerTopic }[],
): void {
  for (const { name, topic } of rows) {
    if (typeof name !== "string" || name === "")
      throw new TypeError("registerBrokerTopics: a topic needs its name");
    if (typeof topic?.publish !== "function")
      throw new TypeError(`registerBrokerTopics: ${name} is not a topic (no publish)`);
    const holder = BROKER_TOPICS.get(name);
    if (holder !== undefined && holder !== topic)
      throw new TypeError(`registerBrokerTopics: two topics are named ${name}`);
    BROKER_TOPICS.set(name, topic);
  }
}
