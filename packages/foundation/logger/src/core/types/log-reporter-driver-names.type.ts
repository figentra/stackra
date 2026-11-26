/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `LogReporter`, so `DriverName<LogReporter>` is `"console" | "otlp"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `LoggingOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { LOG_REPORTER_DRIVERS } from "#core/constants/log-reporter-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `LogReporter` (`console`, `otlp`). */
    "logger.LogReporter": (typeof LOG_REPORTER_DRIVERS)[number];
  }
}
