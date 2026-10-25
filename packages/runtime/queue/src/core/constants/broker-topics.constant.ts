/**
 * Stackra file contract:
 * Purpose: `BROKER_TOPICS`, the generated broker topics of this process by name, which the `topic` driver publishes to.
 * Boundary: process-wide and internal: written by `registerBrokerTopics` (gen's entry) and read by
 *           `TopicBrokerPublisherDriver`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 3 and 6); ADR 0294 (decision 22: gen's registrations).
 */
import type { BrokerTopic } from "#core/types/broker-topic.type";

/** Topic name to topic. */
export const BROKER_TOPICS = new Map<string, BrokerTopic>();
