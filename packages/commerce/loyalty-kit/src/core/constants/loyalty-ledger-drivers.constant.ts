/**
 * Stackra file contract:
 * Purpose: `LOYALTY_LEDGER_DRIVERS`, the names of this package's `LoyaltyLedger` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0266 (decision 2: a memory driver ships with
 *                     the production one).
 */

/** The `LoyaltyLedger` drivers of this package, by name; `postgres` is the default. */
export const LOYALTY_LEDGER_DRIVERS = ["postgres", "memory"] as const;
