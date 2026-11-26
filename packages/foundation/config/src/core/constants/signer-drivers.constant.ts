/**
 * Stackra file contract:
 * Purpose: `SIGNER_DRIVERS`, the names of this package's `Signer` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0416.
 */

/** The `Signer` drivers of this package, by name; `ephemeral` is the default. */
export const SIGNER_DRIVERS = ["ephemeral", "kms"] as const;
