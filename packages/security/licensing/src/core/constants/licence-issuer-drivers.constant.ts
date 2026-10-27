/**
 * Stackra file contract:
 * Purpose: `LICENCE_ISSUER_DRIVERS`, the names of this package's `LicenceIssuer` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0266 (decision 2: a memory driver ships with
 *                     the production one); ADR 0178 (decision 2); ADR 0453 (decision 15).
 */

/**
 * The `LicenceIssuer` drivers of this package, by name; `registry` (the Stackra registry licence API) is the default,
 * `keygen` stays for an on-prem customer who runs Keygen (ADR 0453 decision 15).
 */
export const LICENCE_ISSUER_DRIVERS = ["registry", "keygen", "memory"] as const;
