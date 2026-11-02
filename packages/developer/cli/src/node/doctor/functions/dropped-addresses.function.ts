/**
 * Stackra file contract:
 * Purpose: `droppedAddresses(probes)`, the addresses whose TLS handshake failed while another address of the same host
 *          answered: the pattern of a network that drops some edges (some GitHub, Fastly or Cloudflare addresses),
 *          which a tunnel such as Cloudflare WARP fixes, unlike a host that is down everywhere.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-016.
 */
import type { HostProbe } from "#node/doctor/types/host-probe.type";

/**
 * The failed probes of hosts that answered on another address.
 *
 * @param probes - one probe per resolved address.
 * @example
 * droppedAddresses([{ host: "github.com", address: "a", ok: true }, { host: "github.com", address: "b", ok: false }]);
 * // [{ host: "github.com", address: "b", ok: false }]
 */
export function droppedAddresses(probes: readonly HostProbe[]): HostProbe[] {
  const answering = new Set(probes.filter((probe) => probe.ok).map((probe) => probe.host));
  return probes.filter((probe) => !probe.ok && answering.has(probe.host));
}
