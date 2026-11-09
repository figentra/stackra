/**
 * Stackra file contract:
 * Purpose: `surfaceHosts(root, environment)`, the host map of one environment: every resolved host of every web
 *          surface (`host` and `hosts[].host` under `domains.zone`, as `platformRows` resolves them), once each.
 *          The edge routes and the post-deploy per-host probe both read it (STA-267).
 * Boundary: pure; a name that does not resolve is left out (`platformRows` refuses it); `ops` has no host.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (the KV copy); owner decision D9 (host pattern); STA-267.
 */
import { resolveHost } from "#core/functions/resolve-host.function";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * The resolved surface hosts of `environment`, sorted.
 *
 * @example
 * surfaceHosts(root, "production"); // ["app.mezzora.figentra.com", "mezzora.com"]
 */
export function surfaceHosts(root: RootRunway, environment: string): string[] {
  const zone = root.environments[environment as keyof RootRunway["environments"]]?.domains?.zone;
  const hosts = new Set<string>();
  for (const surface of Object.keys(root.surfaces ?? {})) {
    const entry = surface === "ops" ? undefined : root.surfaces?.[surface];
    for (const name of [entry?.host, ...(entry?.hosts ?? []).map((item) => item.host)]) {
      const host = name === undefined ? undefined : resolveHost(name, zone);
      if (host !== undefined) hosts.add(host);
    }
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here; toSorted is ES2023 and the base lib is ES2022
  return [...hosts].sort();
}
