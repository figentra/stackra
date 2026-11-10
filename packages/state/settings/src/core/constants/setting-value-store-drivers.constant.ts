/**
 * Stackra file contract:
 * Purpose: `SETTING_VALUE_STORE_DRIVERS`, the names of this package's `SettingValueStore` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0213.
 */

/**
 * The `SettingValueStore` drivers of this package, by name; `memory` is the default, `postgres` is a service's
 * (`./node`).
 */
export const SETTING_VALUE_STORE_DRIVERS = ["memory", "postgres"] as const;
