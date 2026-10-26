/**
 * Stackra file contract:
 * Purpose: `FlagProviderName`, the driver names of the `FlagProvider` port (`config`, `memory`, `posthog`), registered under
 *          the port key `feature_flags.FlagProvider` so a `DriverName<FlagProvider>` field type-checks in this package
 *          before any host's gen has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names gen writes for this port in a host's
 *           `#stackra/wiring`, so the two declarations agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a `DriverName<Port>` field); ADR 0263 (decision 9).
 */

/** The drivers of `FlagProvider`. */
export type FlagProviderName = "config" | "memory" | "posthog";

declare module "@stackra/container" {
  interface DriverRegistry {
    "feature_flags.FlagProvider": FlagProviderName;
  }
}
