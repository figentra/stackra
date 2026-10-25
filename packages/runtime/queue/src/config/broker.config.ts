/**
 * Stackra file contract:
 * Purpose: `BrokerConfig`, the broker publisher's configuration (key `queue.broker`): the driver, and the Valkey
 *          server, key prefix and stream length of the `valkey` driver.
 * Boundary: a configuration class over `BrokerOptions` with no env map; runway's `config.queue.broker` layer sets it
 *           per environment, and the `QUEUE_BROKER_VALKEY_URL` secret comes from the secret store.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0148 (decision 3).
 */
import { Config } from "@stackra/config";

import { BrokerOptions } from "#core/schemas/broker-options.schema";

/**
 * The broker publisher's configuration.
 *
 * @example
 * import { BrokerConfig as BaseBrokerConfig } from "@stackra/queue";
 *
 * export class BrokerConfig extends BaseBrokerConfig {
 *   override driver: DriverName<BrokerPublisher> = "valkey";
 * }
 */
export class BrokerConfig extends Config({ schema: BrokerOptions }) {}
