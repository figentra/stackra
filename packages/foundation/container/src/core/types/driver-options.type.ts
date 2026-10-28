/**
 * Stackra file contract:
 * Purpose: `DriverOptions`, the optional second argument of `Driver(Port, options)`: `internal` keeps a driver out of
 *          every candidate list, and `testDefault` makes it the driver its own package's tests take for its port.
 * Boundary: a type only. Gen reads the options from the source; the container only records them with the kind.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0266 (2026-10-28 note: internal and test-default drivers).
 */

/** How gen treats a driver beyond implementing its port. */
export interface DriverOptions {
  /**
   * A helper the package uses itself and does not export (a dev fallback, a worker-only proxy): never a candidate in
   * a manifest or a wiring, so no host can select it.
   */
  readonly internal?: boolean;
  /**
   * The driver the package's own tests take when nothing selects one and it ships no `memory` or single `./testing`
   * driver. Hosts are unaffected; they select through config as before.
   */
  readonly testDefault?: boolean;
}
