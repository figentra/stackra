/**
 * Stackra file contract:
 * Purpose: `RealtimeLocalRelayName`, the driver names of the `RealtimeLocalRelay` port (`lan`), registered under the
 *          port key `realtime.RealtimeLocalRelay` so `RealtimeConfig.localRelay` type-checks before any host's gen has
 *          run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names gen writes for this port.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9).
 */

/** The drivers of `RealtimeLocalRelay`. */
export type RealtimeLocalRelayName = "lan";

declare module "@stackra/container" {
  interface DriverRegistry {
    "realtime.RealtimeLocalRelay": RealtimeLocalRelayName;
  }
}
