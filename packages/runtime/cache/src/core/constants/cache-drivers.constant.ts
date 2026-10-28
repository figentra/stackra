/**
 * Stackra file contract:
 * Purpose: `CACHE_DRIVERS`, the driver names of the `Cache` port this package ships, in the order the README lists
 *          them: each is its driver file's prefix (`valkey-cache.driver.ts` is `valkey`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `driver` enum and the
 *           `DriverRegistry` entry are both read from it, so the two never drift. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0263
 *                     (decision 9); ADR 0150 (decision 1, amended by ADR 0297 decision 3); STA-1438 (`postgres`).
 */

/** The `Cache` drivers of this package, by name. */
export const CACHE_DRIVERS = ["memory", "storage", "valkey", "postgres", "workers"] as const;
