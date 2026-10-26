/**
 * Stackra file contract:
 * Purpose: the Valkey driver of the `BrokerPublisher` port (driver name `valkey`): each topic is a Valkey stream
 *          (`queue.broker.valkey.keyPrefix` plus the topic), each message one `XADD` entry with its id and JSON body,
 *          the stream trimmed to about `maxLength` entries.
 * Boundary: the server is the `QUEUE_BROKER_VALKEY_URL` secret. Publishing only: consumers read the stream with a
 *           consumer group of their own and deduplicate by the message id. A command is retried once, then rejects, so
 *           the caller's retry owns an unreachable server.
 * Runtime: node
 * Governing contract: ADR 0148 (decision 3: Valkey as an option); ADR 0150 (the Valkey client); ADR 0173 (secrets by
 *                     name); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import Valkey from "iovalkey";

import type { BrokerConfig } from "#config/broker.config";
import { BrokerPublisher } from "#contracts/index";
import type { BrokerMessage } from "#contracts/index";

/**
 * Publishes to Valkey streams.
 *
 * @example
 * // runway.yaml (on-prem): config.queue.broker: { driver: valkey }
 * await broker.publish("orders.order.paid.v1", { id: envelope.id, body: envelope });
 */
export class ValkeyBrokerPublisherDriver extends Driver(BrokerPublisher) {
  /** The client every call goes through. */
  readonly client: Valkey;

  private readonly config: BrokerConfig;

  /**
   * @param config - the server (`valkeyUrl`, the `QUEUE_BROKER_VALKEY_URL` secret), key prefix and stream length.
   * @throws TypeError when the `QUEUE_BROKER_VALKEY_URL` secret is not set.
   */
  constructor(config: BrokerConfig) {
    super();
    if (config.valkeyUrl === "")
      throw new TypeError(
        "The valkey broker publisher needs a server: set the QUEUE_BROKER_VALKEY_URL secret",
      );
    this.config = config;
    this.client = new Valkey(config.valkeyUrl, { maxRetriesPerRequest: 1 });
  }

  /** Hands `message` to `topic`, resolving once it is held. */
  async publish(topic: string, message: BrokerMessage): Promise<void> {
    const { keyPrefix, maxLength } = this.config.valkey;
    await this.client.xadd(
      keyPrefix + topic,
      "MAXLEN",
      "~",
      String(maxLength),
      "*",
      "id",
      message.id,
      "body",
      JSON.stringify(message.body ?? null),
    );
  }
}
