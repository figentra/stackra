/**
 * Stackra file contract:
 * Purpose: `PERSONAL_DATA_STORE_DRIVERS`, the names of this package's `PersonalDataStore` drivers, their file
 *          prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0266 (decision 2: a memory driver ships with
 *                     the production one); STA-1375.
 */

/** The `PersonalDataStore` drivers of this package, by name; `repository` is the default. */
export const PERSONAL_DATA_STORE_DRIVERS = ["repository", "memory"] as const;
