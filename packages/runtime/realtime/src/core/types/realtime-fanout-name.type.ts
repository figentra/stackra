/**
 * Stackra file contract:
 * Purpose: `RealtimeFanoutName`, the driver names of the `RealtimeFanout` port (`local`, `memory`, `valkey`), registered under
 *          the port key `realtime.RealtimeFanout` so `RealtimeConfig.fanout` type-checks before any host's gen has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names gen writes for this port.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9).
 */

/** The drivers of `RealtimeFanout`. */
export type RealtimeFanoutName = "local" | "memory" | "valkey";

declare module "@stackra/container" {
  interface DriverRegistry {
    "realtime.RealtimeFanout": RealtimeFanoutName;
  }
}
