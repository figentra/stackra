/**
 * Stackra file contract:
 * Purpose: `STORE_DRIVERS`, the driver names this package ships for its two hot-path stores, `IdempotencyStore` and
 *          `RateLimitStore`: each is its driver file's prefix (`valkey-rate-limit-store.driver.ts` is `valkey`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's enums and the
 *           `DriverRegistry` entries are read from it. The durable Postgres stores ship with @stackra/database (it
 *           depends on this package), so their name joins there. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9); ADR 0136 (decision 3); ADR 0217.
 */

/** The store drivers of this package, by name. */
export const STORE_DRIVERS = ["memory", "valkey"] as const;
