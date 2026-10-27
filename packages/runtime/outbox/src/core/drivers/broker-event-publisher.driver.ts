/**
 * Stackra file contract:
 * Purpose: `BrokerEventPublisherDriver`, the broker driver of the `EventPublisher` port (driver name `broker`): the relay
 *          publishes each integration event to the broker topic named by its wire name, through @stackra/queue's
 *          `BrokerPublisher`, so other services receive it from Encore Pub/Sub in SaaS or a Valkey stream on-prem.
 * Boundary: the message id is the event id (consumers deduplicate by it in their inbox) and the body is the envelope as
 *           it is. Which broker carries it is `queue.broker.driver`'s choice, never this driver's. A rejection reaches
 *           the relay, which retries the message after its backoff.
 * Runtime: isomorphic
 * Governing contract: ADR 0142 (decisions 1 and 2: transports are drivers); ADR 0148 (decision 3); ADR 0141 (decision
 *                     2: the envelope); ADR 0078 (decisions 4 and 8).
 */
import { Driver } from "@stackra/container";
import type { BrokerPublisher } from "@stackra/queue/contracts";

import { EventPublisher } from "#contracts/index";
import type { EventEnvelope } from "#contracts/index";

/**
 * Publishes integration events to the broker.
 *
 * @example
 * // generated wiring: { port: EventPublisher, candidates: { broker: … }, deps: { broker: [BrokerPublisher] } }
 * await publisher.publish(envelope); // topic "orders.order.paid.v1"
 */
export class BrokerEventPublisherDriver extends Driver(EventPublisher) {
  private readonly broker: BrokerPublisher;

  /**
   * @param broker - the broker the events are published to.
   */
  constructor(broker: BrokerPublisher) {
    super();
    this.broker = broker;
  }

  /** Implements `EventPublisher.publish`, documented there. */
  publish(envelope: EventEnvelope): Promise<void> {
    return this.broker.publish(envelope.type, { id: envelope.id, body: envelope });
  }
}
