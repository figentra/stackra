/**
 * Stackra file contract:
 * Purpose: `zoneOf(hostname, zones)`, the zone a host lives in: the longest zone name the host equals or ends with
 *          `.<zone>`, so `api.eu.example.com` falls in `eu.example.com` before `example.com`.
 * Boundary: pure; matches names only, never looks up DNS.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 6: zones from the root runway), ADR 0437 (decision 5: origins under a zone).
 */

/**
 * The zone of `hostname` among `zones`, or undefined when none holds it.
 *
 * @example
 * zoneOf("api-me-central.figentra.com", ["figentra.com", "figentra.cloud"]); // "figentra.com"
 */
export function zoneOf(hostname: string, zones: Iterable<string>): string | undefined {
  let found: string | undefined;
  for (const zone of zones)
    if ((hostname === zone || hostname.endsWith(`.${zone}`)) && zone.length > (found?.length ?? 0))
      found = zone;
  return found;
}
