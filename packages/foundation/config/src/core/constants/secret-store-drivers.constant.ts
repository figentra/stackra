/**
 * Stackra file contract:
 * Purpose: `SECRET_STORE_DRIVERS`, the names of this package's `SecretStore` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0173.
 */

/** The `SecretStore` drivers of this package, by name; `memory` is the default. */
export const SECRET_STORE_DRIVERS = ["memory", "aws_secrets_manager"] as const;
