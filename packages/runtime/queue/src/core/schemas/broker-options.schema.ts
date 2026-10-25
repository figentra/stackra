/**
 * Stackra file contract:
 * Purpose: `BrokerOptions`, the shape of `BrokerConfig`: which `BrokerPublisher` driver runs, and the `valkey` driver's
 *          server, key prefix and stream length.
 * Boundary: a shape class; it registers this package's own schema (`BROKER_CONFIG_SCHEMA`) for itself when the module
 *           loads. The default is `memory`, so a service tests before any broker exists (ADR 0266 decision 2); a
 *           deployment names its broker in runway. The Valkey URL carries the password, so it is the
 *           `QUEUE_BROKER_VALKEY_URL` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 3); ADR 0266 (decisions 2 and 5); ADR 0294 (decisions 4, 19 and 26); ADR 0173.
 */
import "#core/types/broker-publisher-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { BrokerPublisher } from "#contracts/ports/broker-publisher.port";
import { BROKER_CONFIG_SCHEMA } from "#core/constants/broker-config-schema.constant";

/**
 * The broker publisher's settings.
 *
 * @example
 * export class BrokerConfig extends BaseBrokerConfig {
 *   override driver: DriverName<BrokerPublisher> = "topic";
 * }
 */
export class BrokerOptions extends Schema {
  /** `memory` delivers in process; `topic` publishes to the generated broker topics; `valkey` to Valkey streams. */
  driver: DriverName<BrokerPublisher> = "memory";

  /** The `valkey` driver's server (`redis://` or `rediss://`, with its password); empty until the secret is set. */
  @Secret("QUEUE_BROKER_VALKEY_URL")
  valkeyUrl = "";

  /** The `valkey` driver's streams. */
  valkey: {
    /** Put in front of every topic's stream key. */
    keyPrefix: string;
    /** About how many messages a stream keeps; older ones are trimmed. */
    maxLength: number;
  } = { keyPrefix: "broker:", maxLength: 100_000 };
}

registerSchemas([[BrokerOptions, BROKER_CONFIG_SCHEMA]]);
