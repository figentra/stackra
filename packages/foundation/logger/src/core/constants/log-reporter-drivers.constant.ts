/**
 * Stackra file contract:
 * Purpose: `LOG_REPORTER_DRIVERS`, the names of this package's `LogReporter` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0263.
 */

/** The `LogReporter` drivers of this package, by name; `console` is the default. */
export const LOG_REPORTER_DRIVERS = ["console", "otlp"] as const;
