/**
 * Stackra file contract:
 * Purpose: `LOCK_DRIVERS`, the driver names of the `LockDriver` port this package ships: each is its driver file's
 *          prefix (`postgres-lock.driver.ts` is `postgres`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `driver` enum and the
 *           `DriverRegistry` entry are both read from it, so the two never drift. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0263
 *                     (decision 9).
 */

/** The `LockDriver` drivers of this package, by name. */
export const LOCK_DRIVERS = ["postgres", "valkey", "memory"] as const;
