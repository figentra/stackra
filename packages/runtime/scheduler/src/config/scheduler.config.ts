/**
 * Stackra file contract:
 * Purpose: `SchedulerConfig`, the scheduler configuration (key `scheduler`): the `driver` choice runway sets per
 *          environment (`postgres` by default, `memory` for a test or a single process), the catch-up window and the
 *          default missed-run policy.
 * Boundary: a configuration class over `SchedulerOptions` with no env map; runway's `config.scheduler` layer sets it. A
 *           host overrides it as `class SchedulerConfig extends BaseSchedulerConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1); ADR 0148
 *                     (decisions 4 and 5).
 */
import { Config } from "@stackra/config";

import { SchedulerOptions } from "#core/schemas/scheduler-options.schema";

/**
 * The scheduler configuration.
 *
 * @example
 * import { SchedulerConfig as BaseSchedulerConfig } from "@stackra/scheduler";
 *
 * export class SchedulerConfig extends BaseSchedulerConfig {
 *   override driver: DriverName<ScheduleDriver> = "memory";
 * }
 */
export class SchedulerConfig extends Config({ schema: SchedulerOptions }) {}
