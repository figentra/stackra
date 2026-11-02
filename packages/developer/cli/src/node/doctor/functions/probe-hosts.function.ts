/**
 * Stackra file contract:
 * Purpose: `probeHosts(hosts, timeoutMs?)`, one `HostProbe` per address of each host: the name is resolved through the
 *          system resolver (some networks block outside DNS), then a TLS handshake with the host's name is tried on
 *          port 443 of every IPv4 address, all at once, each within the timeout.
 * Boundary: network reads only (DNS and a TLS handshake that sends nothing after it); the socket is closed at once.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-016.
 */
import { lookup } from "node:dns/promises";
import { connect } from "node:tls";

import type { HostProbe } from "#node/doctor/types/host-probe.type";

/** Whether a TLS handshake with `address` for `host` finishes in time. */
function handshake(host: string, address: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: address, port: 443, servername: host, timeout: timeoutMs });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.once("secureConnect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

/**
 * Probes every address of every host.
 *
 * @param hosts - the host names.
 * @param timeoutMs - the time each handshake may take (default 4 s).
 * @example
 * const probes = await probeHosts(["github.com"]);
 */
export async function probeHosts(hosts: readonly string[], timeoutMs = 4000): Promise<HostProbe[]> {
  const perHost = await Promise.all(
    hosts.map(async (host): Promise<HostProbe[]> => {
      const addresses = await lookup(host, { all: true, family: 4 }).catch(() => []);
      if (addresses.length === 0) return [{ host, address: "", ok: false }];
      return Promise.all(
        addresses.map(async ({ address }) => ({
          host,
          address,
          ok: await handshake(host, address, timeoutMs),
        })),
      );
    }),
  );
  return perHost.flat();
}
