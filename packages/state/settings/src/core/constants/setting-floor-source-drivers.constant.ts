/**
 * Stackra file contract:
 * Purpose: `SETTING_FLOOR_SOURCE_DRIVERS`, the names of this package's `SettingFloorSource` drivers, their file
 *          prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0213.
 */

/**
 * The `SettingFloorSource` drivers of this package, by name; `memory` is the default, `market_pack` reads the market
 * pack's floors and `registered_floor_guard` (`./node`) reads the floors the services registered.
 */
export const SETTING_FLOOR_SOURCE_DRIVERS = [
  "market_pack",
  "memory",
  "registered_floor_guard",
] as const;
