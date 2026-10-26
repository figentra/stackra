/**
 * Stackra file contract:
 * Purpose: `RESOLVED_PACK_SOURCE_DRIVERS`, the names of this package's `ResolvedPackSource` drivers, their file
 *          prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0418; ADR 0294 (decision 16: drivers named by file); ADR 0266 (decision 2: a memory driver
 *                     ships with the production one).
 */

/** The `ResolvedPackSource` drivers of this package, by name; `store` is the default. */
export const RESOLVED_PACK_SOURCE_DRIVERS = ["store", "memory"] as const;
