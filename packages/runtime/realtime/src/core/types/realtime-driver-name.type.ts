/**
 * Stackra file contract:
 * Purpose: `RealtimeDriverName`, the driver names of the `RealtimeDriver` port (`sse`, `websocket`, `memory`),
 *          registered under the port key `realtime.RealtimeDriver` so `RealtimeConfig.driver` type-checks in this
 *          package before any host's gen has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names gen writes for this port in a
 *           service's `#stackra/wiring`, so the two declarations agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a `DriverName<Port>` field); ADR 0263 (decision 9).
 */

/** The drivers of `RealtimeDriver`. */
export type RealtimeDriverName = "sse" | "websocket" | "memory";

declare module "@stackra/container" {
  interface DriverRegistry {
    "realtime.RealtimeDriver": RealtimeDriverName;
  }
}
