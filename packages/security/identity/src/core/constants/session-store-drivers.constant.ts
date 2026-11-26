/**
 * Stackra file contract:
 * Purpose: `SESSION_STORE_DRIVERS`, the names of this package's `SessionStore` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0206; ADR 0241.
 */

/**
 * The `SessionStore` drivers of this package, by name; `memory` is the default. `bff` and `pkce` are an app's: gen
 * gives them from the app's flow, ahead of the selector.
 */
export const SESSION_STORE_DRIVERS = ["bff", "memory", "pkce"] as const;
