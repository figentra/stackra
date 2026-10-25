/**
 * Stackra file contract:
 * Purpose: `SCHEDULE_DRIVERS`, the driver names of the `ScheduleDriver` port this package ships: each is its driver
 *          file's prefix (`postgres-schedule.driver.ts` is `postgres`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `driver` enum and the
 *           `DriverRegistry` entry are both read from it, so the two never drift. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0263
 *                     (decision 9); ADR 0148 (decision 4).
 */

/** The `ScheduleDriver` drivers of this package, by name. */
export const SCHEDULE_DRIVERS = ["postgres", "memory"] as const;
