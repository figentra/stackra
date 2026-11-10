/**
 * Stackra file contract:
 * Purpose: `KEY_PROVIDER_DRIVERS`, the names of this package's `KeyProvider` container drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0188 (2026-11-09 amendment).
 */

/** The `KeyProvider` drivers of this package, by name; `ephemeral` is the default. */
export const KEY_PROVIDER_DRIVERS = ["ephemeral", "kms"] as const;
