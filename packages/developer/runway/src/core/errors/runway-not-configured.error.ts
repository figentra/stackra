/**
 * Stackra file contract:
 * Purpose: `RunwayNotConfiguredError`, thrown by a Runway driver whose vendor is not wired in this package yet (the
 *          Cloudflare KV edge store, the OS registry bundle publisher): it names the port and what to bind instead.
 * Boundary: a plain `Error` with the port's name; a caller binds another driver behind the same port. It names
 *           ports and vendors, never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (ports resolve by type; a driver is swapped, not patched), ADR 0437 (decision 6),
 *                     ADR 0436 (decision 4).
 */

/**
 * A driver with no vendor behind it.
 *
 * @example
 * await new CloudflareKvEdgeStoreDriver().put("host:console.acme.example.com", "{}");
 * // throws RunwayNotConfiguredError: "EdgeStore: …"
 */
export class RunwayNotConfiguredError extends Error {
  /** The port the driver serves (`EdgeStore`). */
  readonly port: string;

  /**
   * @param port - the port's name.
   * @param message - what is missing and what to bind instead.
   */
  constructor(port: string, message: string) {
    super(`${port}: ${message}`);
    this.name = "RunwayNotConfiguredError";
    this.port = port;
  }
}
