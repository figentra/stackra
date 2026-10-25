/**
 * Stackra file contract:
 * Purpose: the `BrokerPublisher` port: hands a message to a named topic of a message broker, so events and jobs leave a
 *          service through whatever broker the deployment runs. Config `queue.broker.driver` picks the driver
 *          (`memory`, `topic` for the generated Encore Pub/Sub topics, `valkey` for Valkey streams).
 * Boundary: an abstract class that is its own token, keyed `queue.BrokerPublisher`. `publish` resolves once the broker
 *           holds the message; a rejection means it may not, so the caller (the outbox relay) retries, and a broker may
 *           deliver a message more than once. A driver never imports `encore.dev`: the generated topics reach it as
 *           structural objects (ADR 0078 decision 8). A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 3); ADR 0142 (decisions 1 and 2); ADR 0266 (decision 4.3: memory, then
 *                     encore-pubsub); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { BrokerMessage } from "#contracts/types/broker-message.type";

/**
 * Publishes to broker topics.
 *
 * @example
 * await broker.publish("orders.order.paid.v1", { id: envelope.id, body: envelope });
 */
export abstract class BrokerPublisher extends Port {
  /** Type-only port key, so `DriverName<BrokerPublisher>` narrows to this port's drivers. */
  declare readonly "~key": "queue.BrokerPublisher";

  /** Hands `message` to `topic`; resolves once the broker holds it. */
  abstract publish(topic: string, message: BrokerMessage): Promise<void>;
}
