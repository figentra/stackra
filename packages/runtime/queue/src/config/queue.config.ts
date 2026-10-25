/**
 * Stackra file contract:
 * Purpose: `QueueConfig`, the queue configuration (key `queue`): the `driver` choice runway sets per environment
 *          (`postgres` by default, `memory` for a test or a single process).
 * Boundary: a configuration class over `QueueOptions` with no env map; runway's `config.queue` layer sets it. A host
 *           overrides it as `class QueueConfig extends BaseQueueConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1); ADR 0148
 *                     (decision 3).
 */
import { Config } from "@stackra/config";

import { QueueOptions } from "#core/schemas/queue-options.schema";

/**
 * The queue configuration.
 *
 * @example
 * import { QueueConfig as BaseQueueConfig } from "@stackra/queue";
 *
 * export class QueueConfig extends BaseQueueConfig {
 *   override driver: DriverName<QueueDriver> = "memory";
 * }
 */
export class QueueConfig extends Config({ schema: QueueOptions }) {}
