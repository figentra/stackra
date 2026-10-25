/**
 * Stackra file contract:
 * Purpose: `QueueLeaderName`, the driver names of the `QueueLeader` port (`broadcast_channel`, `memory`), registered
 *          under the port key `query.QueueLeader` so the `DriverName<QueueLeader>` field of `QueryConfig` type-checks
 *          before any host's gen has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names gen writes for this port in a host's
 *           `#stackra/wiring` (the drivers are `@stackra/coordinator`'s), so the two declarations agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a `DriverName<Port>` field); ADR 0263 (decision 9).
 */

/** The drivers of `QueueLeader`. */
export type QueueLeaderName = "broadcast_channel" | "memory";

declare module "@stackra/container" {
  interface DriverRegistry {
    "query.QueueLeader": QueueLeaderName;
  }
}
