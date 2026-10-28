/**
 * Stackra file contract:
 * Purpose: `AnalyticsDriverName`, the driver names of the `AnalyticsDriver` port this package ships (`none`, `memory`,
 *          `posthog` and `ad-pixel` in `.`, the native `posthog` in `./native`), registered under the port key
 *          `analytics.AnalyticsDriver` so `AnalyticsConfig.driver` type-checks before any host's gen has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names of the drivers this package ships
 *           (named by their file prefix), so it agrees with what gen writes for this port.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a `DriverName<Port>` field); ADR 0263 (decision 9).
 */

/** The drivers of `AnalyticsDriver`. */
export type AnalyticsDriverName = "none" | "memory" | "posthog" | "ad-pixel";

declare module "@stackra/container" {
  interface DriverRegistry {
    "analytics.AnalyticsDriver": AnalyticsDriverName;
  }
}
