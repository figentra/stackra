/**
 * Stackra file contract:
 * Purpose: `RealtimeTransportName`, the driver names of the `RealtimeTransport` port (`websocket`, `memory`),
 *          registered under the port key `realtime.RealtimeTransport`.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names gen writes for this port in an app's
 *           `#stackra/wiring`, so the two declarations agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9).
 */

/** The drivers of `RealtimeTransport`. */
export type RealtimeTransportName = "websocket" | "memory";

declare module "@stackra/container" {
  interface DriverRegistry {
    "realtime.RealtimeTransport": RealtimeTransportName;
  }
}
