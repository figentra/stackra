/**
 * Stackra file contract:
 * Purpose: `DATABASE_DRIVERS`, the names of this package's `Database` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0014.
 */

/**
 * The `Database` drivers of this package, by name: `postgres` is the default; `memory` is the testing driver, which a
 * test picks with `useDrivers` and no deployment selects.
 */
export const DATABASE_DRIVERS = ["postgres", "memory"] as const;
