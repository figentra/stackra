/**
 * Stackra file contract:
 * Purpose: `BrokerTopic`, a generated broker topic as the `topic` driver sees it: anything with a `publish(message)`
 *          that resolves once the broker holds the message (an Encore `Topic` is one).
 * Boundary: a structural type only, so this package never imports `encore.dev` (ADR 0078 decision 8): gen registers
 *           the topics it emits with `registerBrokerTopics`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 3 and 6: gen emits Encore topics in SaaS); ADR 0142 (decision 1).
 */
import type { BrokerMessage } from "#contracts/types/broker-message.type";

/** A topic a broker publishes to. */
export interface BrokerTopic {
  /** Hands `message` to the broker. */
  publish(message: BrokerMessage): Promise<unknown>;
}
