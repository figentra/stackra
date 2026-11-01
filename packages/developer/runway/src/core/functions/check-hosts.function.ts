/**
 * Stackra file contract:
 * Purpose: `checkHosts(root)`, the surface host collision check (STA-1796): in each environment, every web surface's
 *          `host` and `hosts[].host` resolve as `platformRows` resolves them (`resolveHost` under `domains.zone`), and two
 *          surfaces on one host fail, both named, because the edge keeps one KV row per host and the second would
 *          silently replace the first.
 * Boundary: pure; returns every failure instead of throwing. A name that does not resolve is not checked here
 *           (`platformRows` refuses it). One surface naming a host twice is not a collision; `ops` is skipped, as
 *           `platformRows` writes no row for it. Path-prefix routing (several surfaces on one host) is not supported.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (the KV copy, one row per host); owner decisions D2 and D9; STA-1796.
 */
import { resolveHost } from "#core/functions/resolve-host.function";
import type { HostIssue } from "#core/types/host-issue.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * Every host collision across the root's environments; `[]` when each host has one surface.
 * @param root - the parsed root runway.
 * @example
 * checkHosts(root);
 * // [{ code: "host_collision", host: "app.mezzora.figentra.com", environment: "production",
 * //    surfaces: ["console", "web"], path: "surfaces.web.host", message: "…" }]
 */
export function checkHosts(root: RootRunway): HostIssue[] {
  const issues: HostIssue[] = [];
  for (const [environment, env] of Object.entries(root.environments ?? {})) {
    const zone = env?.domains?.zone;
    const owners = new Map<string, string>();
    for (const [surface, entry] of Object.entries(root.surfaces ?? {})) {
      if (surface === "ops" || entry === undefined) continue;
      const at = `surfaces.${surface}`;
      const claims = [
        ...(entry.host === undefined ? [] : [{ name: entry.host, path: `${at}.host` }]),
        ...(entry.hosts ?? []).map((item, index) => ({
          name: item.host,
          path: `${at}.hosts.${index}.host`,
        })),
      ];
      for (const claim of claims) {
        const host = resolveHost(claim.name, zone);
        if (host === undefined) continue;
        const first = owners.get(host);
        if (first === undefined) owners.set(host, surface);
        else if (first !== surface)
          issues.push({
            code: "host_collision",
            host,
            environment,
            surfaces: [first, surface],
            path: claim.path,
            message:
              `surfaces ${first} and ${surface} both resolve to ${host} in environments.${environment}: the edge ` +
              "keeps one row per host, so give each surface its own host (host_collision)",
          });
      }
    }
  }
  return issues;
}
