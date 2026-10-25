/**
 * Stackra file contract:
 * Purpose: `SchedulerOptions`, the shape of `SchedulerConfig`: which schedule driver runs, the catch-up window of a
 *          tick, and the default missed-run policy.
 * Boundary: a shape class; it registers this package's own schema (`SCHEDULER_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(SchedulerConfig)` validates with no generated file. Deploy-time values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0148 (decisions 4 and 5).
 */
import "#core/types/schedule-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { Misfire } from "#contracts/enums/misfire.enum";
import type { ScheduleDriver } from "#contracts/ports/schedule-driver.port";
import { SCHEDULER_CONFIG_SCHEMA } from "#core/constants/scheduler-config-schema.constant";

/**
 * The scheduler settings.
 *
 * @example
 * export class SchedulerConfig extends BaseSchedulerConfig {
 *   override catchUpWindow = Duration.hours(6);
 *   override misfire: Misfire = Misfire.Once;
 * }
 */
export class SchedulerOptions extends Schema {
  /** Which driver runs: `postgres` keeps schedules in the service's database; `memory` in the process. */
  driver: DriverName<ScheduleDriver> = "postgres";

  /** How far back a tick looks for runs it missed, from one minute to one day; older runs are dropped. */
  catchUpWindow: Duration = Duration.hours(1);

  /** The missed-run policy of every cron of an action, and of a stored schedule that names none. */
  misfire: Misfire = Misfire.CatchUp;
}

registerSchemas([[SchedulerOptions, SCHEDULER_CONFIG_SCHEMA]]);
