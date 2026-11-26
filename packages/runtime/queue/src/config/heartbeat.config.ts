/**
 * Stackra file contract:
 * Purpose: `HeartbeatConfig`, the heartbeat configuration (key `queue.heartbeat`): the URL each cron, relay and worker
 *          of the service beats, the shortest gap between two beats of one job, and how long a beat may take.
 * Boundary: a configuration class over `HeartbeatOptions` with no env map; runway's `config.queue.heartbeat` layer sets
 *           the gap and the timeout, and the `STACKRA_HEARTBEAT_URLS` secret comes from the secret store.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";

import { HeartbeatOptions } from "#core/schemas/heartbeat-options.schema";

/**
 * The heartbeat configuration.
 *
 * @example
 * import { HeartbeatConfig as BaseHeartbeatConfig } from "@stackra/queue";
 *
 * export class HeartbeatConfig extends BaseHeartbeatConfig {
 *   override minInterval = Duration.seconds(5);
 * }
 */
export class HeartbeatConfig extends Config({ schema: HeartbeatOptions }) {}
