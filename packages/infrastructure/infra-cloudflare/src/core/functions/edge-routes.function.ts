/**
 * Stackra file contract:
 * Purpose: `edgeRoutes(root, routes, zones)`, the edge Worker's route patterns per zone: the stack's own patterns
 *          plus `<host>/*` for every surface host of the root runway's host map (`surfaceHosts`, every environment)
 *          that sits under one of `zones`.
 * Boundary: pure; a host under no zone (a product's own domain on a SaaS zone) gets no generated route.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (one KV row per host); ADR 0175 (edge routes); STA-267.
 */
import { surfaceHosts, type RootRunway } from "@stackra/runway";

import { zoneOf } from "#core/functions/zone-of.function";

/**
 * The route patterns by zone, hand-authored ones first, generated ones sorted and deduplicated.
 *
 * @example
 * edgeRoutes(root, { "figentra.com": [] }, ["figentra.com"]); // { "figentra.com": ["app.mezzora.figentra.com/*"] }
 */
export function edgeRoutes(
  root: RootRunway,
  routes: Readonly<Record<string, readonly string[]>>,
  zones: readonly string[],
): Record<string, string[]> {
  const out: Record<string, string[]> = Object.fromEntries(
    Object.entries(routes).map(([zone, patterns]) => [zone, [...patterns]]),
  );
  for (const environment of Object.keys(root.environments))
    for (const host of surfaceHosts(root, environment)) {
      const zone = zoneOf(host, zones);
      const patterns = zone === undefined ? undefined : (out[zone] ??= []);
      if (patterns !== undefined && !patterns.includes(`${host}/*`)) patterns.push(`${host}/*`);
    }
  return out;
}
