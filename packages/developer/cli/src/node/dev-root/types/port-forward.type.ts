/**
 * Stackra file contract:
 * Purpose: `PortForward`, a running forward of one dev port to the gateway (`startPortForward`): the ports and the
 *          addresses it listens on and how to stop it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-2664 (item 2); STA-2840.
 */

/** A running port forward. */
export type PortForward = {
  /** The port it listens on, once per host (the same number unless it was asked for port 0). */
  readonly ports: readonly number[];

  /** The address each server listens on, as the socket reports it (loopback only unless other hosts were asked for). */
  readonly addresses: readonly string[];

  /** Stops listening and drops open connections. */
  readonly close: () => Promise<void>;
};
