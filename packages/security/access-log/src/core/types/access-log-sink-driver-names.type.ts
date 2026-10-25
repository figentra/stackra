/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `AccessLogSink`, so `DriverName<AccessLogSink>` is `"postgres" | "memory"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `AccessLogOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { ACCESS_LOG_SINK_DRIVERS } from "#core/constants/access-log-sink-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `AccessLogSink` (`postgres`, `memory`). */
    "access_log.AccessLogSink": (typeof ACCESS_LOG_SINK_DRIVERS)[number];
  }
}
