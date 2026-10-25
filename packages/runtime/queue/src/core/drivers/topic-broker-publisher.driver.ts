/**
 * Stackra file contract:
 * Purpose: the topic driver of the `BrokerPublisher` port (driver name `topic`): publishes to the broker topic gen
 *          registered under the name, so a service's events and jobs ride the Encore Pub/Sub topics gen emits in SaaS.
 * Boundary: holds no connection: the topics are the generated objects `registerBrokerTopics` recorded, structurally
 *           typed, so this package never imports `encore.dev`. A name with no registered topic rejects with a
 *           TypeError: a missing topic is a wiring bug that the relay's retry and dead letter make visible.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 3 and 6); ADR 0142 (decision 1); ADR 0078 (decision 8: no `encore.dev` in
 *                     packages); ADR 0266 (decision 4.3: encore-pubsub).
 */
import { Driver } from "@stackra/container";

import { BrokerPublisher } from "#contracts/index";
import type { BrokerMessage } from "#contracts/index";
import { BROKER_TOPICS } from "#core/constants/broker-topics.constant";

/**
 * Publishes to the generated topics.
 *
 * @example
 * registerBrokerTopics([{ name: "orders.order.paid.v1", topic: orderPaidTopic }]);
 * await new TopicBrokerPublisherDriver().publish("orders.order.paid.v1", { id, body });
 */
export class TopicBrokerPublisherDriver extends Driver(BrokerPublisher) {
  /** See `BrokerPublisher.publish`. */
  async publish(topic: string, message: BrokerMessage): Promise<void> {
    const target = BROKER_TOPICS.get(topic);
    if (target === undefined)
      throw new TypeError(
        `No broker topic is registered as ${topic}: registerBrokerTopics lists them`,
      );
    await target.publish(message);
  }
}
