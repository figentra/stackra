/**
 * Stackra file contract:
 * Purpose: `UdpSocket`, the part of a bound UDP socket the SIP trunk driver uses for signalling and RTP; a node:dgram
 *          socket satisfies it.
 * Boundary: a type only, so tests drive the driver with recorded datagrams instead of the network.
 * Runtime: node
 * Governing contract: ADR 0376 (decision 7: the SIP driver).
 */
import type { UdpPeer } from "#node/sip/udp-peer.type";

/** A bound UDP socket. */
export interface UdpSocket {
  /** Sends `data` to `address`:`port`. */
  send(data: Uint8Array, port: number, address: string): void;
  /** Calls `listener` with each datagram received. */
  on(event: "message", listener: (data: Uint8Array, from: UdpPeer) => void): unknown;
  /** The local address and port it is bound to. */
  address(): UdpPeer;
  /** Closes it. */
  close(): void;
}
