/**
 * Stackra file contract:
 * Purpose: `networkCheck(hosts, probes)`, the `network` row of `stackra doctor` from the probes of `hosts`: a host with
 *          no answering address fails it, an address dropped while a sibling answers warns, and the fix says what to
 *          look at on any network (the connection, a proxy, a VPN or a firewall), naming no vendor's product.
 * Boundary: pure; the probes come from `probeHosts`.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-016; STA-2859.
 */
import { droppedAddresses } from "#node/doctor/functions/dropped-addresses.function";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";
import type { HostProbe } from "#node/doctor/types/host-probe.type";

/** The fix when a host answers on no address. */
const DOWN_FIX =
  "check that this machine reaches these hosts over HTTPS (port 443): the connection itself, then any proxy, VPN or " +
  "firewall in the way (allow the hosts there); then re-run stackra doctor";

/** The fix when only some addresses of a host answer. */
const DROPPED_FIX =
  "something on the path drops part of these hosts' address ranges (a proxy, VPN or firewall rule): allow every " +
  "address of the host, or route it through one path, then re-run stackra doctor";

/**
 * The network row.
 *
 * @param hosts - the hosts probed, in the order the row names them.
 * @param probes - one probe per address, as `probeHosts` returns them.
 * @example
 * networkCheck(["github.com"], await probeHosts(["github.com"])); // { name: "network", status: "ok", ... }
 */
export function networkCheck(hosts: readonly string[], probes: readonly HostProbe[]): DoctorResult {
  const dropped = droppedAddresses(probes);
  const down = hosts.filter((host) => !probes.some((probe) => probe.host === host && probe.ok));
  return {
    name: "network",
    status: down.length ? "fail" : dropped.length ? "warn" : "ok",
    detail:
      [
        down.length ? `unreachable: ${down.join(", ")}` : "",
        dropped.length
          ? `dropped while sibling addresses answer: ${dropped.map((probe) => `${probe.host} ${probe.address}`).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("; ") || undefined,
    fix: down.length || !dropped.length ? DOWN_FIX : DROPPED_FIX,
  };
}
