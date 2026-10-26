/**
 * Stackra file contract:
 * Purpose: `ACCESS_LOG_SINK_DRIVERS`, the names of this package's `AccessLogSink` drivers, their file prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the shipped config schema and the
 *           `DriverRegistry` augmentation read it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); ADR 0266 (decision 2: a memory driver ships with
 *                     the production one); ADR 0409 (`outbox`, STA-821).
 */

/** The `AccessLogSink` drivers of this package, by name; `postgres` is the default. */
export const ACCESS_LOG_SINK_DRIVERS = ["postgres", "memory", "outbox"] as const;
