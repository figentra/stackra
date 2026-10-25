/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `ScheduleDriver` port, so the `driver` field typed
 *          `DriverName<ScheduleDriver>` and a runway `scheduler.driver` value take exactly this package's driver names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `SchedulerOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { SCHEDULE_DRIVERS } from "#core/constants/schedule-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `ScheduleDriver` (`postgres`, `memory`). */
    "scheduler.ScheduleDriver": (typeof SCHEDULE_DRIVERS)[number];
  }
}
