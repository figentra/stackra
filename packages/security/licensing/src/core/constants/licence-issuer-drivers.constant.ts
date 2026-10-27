/**
 * Stackra file contract:
 * Purpose: `LICENCE_ISSUER_DRIVERS`, the names of this package's `LicenceIssuer` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0266 (decision 2: a memory driver ships with
 *                     the production one); ADR 0178 (decision 2).
 */

/** The `LicenceIssuer` drivers of this package, by name; `keygen` is the default. */
export const LICENCE_ISSUER_DRIVERS = ["keygen", "memory"] as const;
