/**
 * Stackra file contract:
 * Purpose: `ClientTransportName`, the driver names of the `ClientTransport` port this package ships (`http`), registered
 *          under the port key `clients.ClientTransport` so a `DriverName<ClientTransport>` value type-checks before any
 *          host's gen has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the drivers in `core/drivers/` (named by their
 *           file prefix). The in-process and RPC drivers gen writes per topology add their names in the host's wiring.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9); ADR 0260 (decision 6).
 */

/** The drivers of `ClientTransport`. */
export type ClientTransportName = "http";

declare module "@stackra/container" {
  interface DriverRegistry {
    "clients.ClientTransport": ClientTransportName;
  }
}
