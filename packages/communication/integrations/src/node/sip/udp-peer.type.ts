/**
 * Stackra file contract:
 * Purpose: `UdpPeer`, where a datagram came from or goes: an address and a port.
 * Boundary: a type only; node:dgram's `RemoteInfo` and `AddressInfo` satisfy it.
 * Runtime: node
 * Governing contract: ADR 0376 (decision 7: the SIP driver).
 */

/** An address and port. */
export interface UdpPeer {
  /** The peer's IP address. */
  readonly address: string;

  /** The peer's UDP port. */
  readonly port: number;
}
