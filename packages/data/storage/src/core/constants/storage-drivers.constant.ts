/**
 * Stackra file contract:
 * Purpose: `STORAGE_DRIVERS`, the names of this package's `Storage` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0256; ADR 0266 (memory drivers first).
 */

/**
 * The `Storage` drivers of this package, by name; `memory` is the default. `web` (the `./browser` entry) and `native`
 * (the `./native` entry) are an app's: gen's per-runtime defaults give them, ahead of the selector.
 */
export const STORAGE_DRIVERS = ["memory", "web", "native"] as const;
