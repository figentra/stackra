/**
 * Stackra file contract:
 * Purpose: `tunnelIngress(tunnel)`, the ingress rules of one machine's named tunnel: each exposed member's dev host
 *          `<member>-<dev>.<dev zone>` to `http://localhost:<its runway dev port>`, then the `http_status:404`
 *          catch-all cloudflared requires last.
 * Boundary: pure; `devTunnel` writes the rules into the tunnel's remote config and adds a DNS record per host. The
 *           ports come from the member runways (`devPortsOf`); this function never reads a file.
 * Runtime: isomorphic
 * Governing contract: ADR 0290 (decision 2: one label deep, `<app>-<dev>`; decision 4: ingress from the runway ports).
 */
import type { RunwayIssue } from "@stackra/runway";

import { DNS_LABEL_SCHEMA } from "#core/constants/dns-label-schema.constant";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import type { TunnelIngressRule } from "#core/types/tunnel-ingress-rule.type";

/**
 * The ingress rules of the tunnel labelled `label`.
 *
 * @param tunnel - its `<dev>` label, the dev zone, the members' dev ports and the members it exposes (every member
 *                 with a port, sorted, when absent).
 * @throws CloudflareConfigInvalidError when an exposed member has no dev port, or its host is not one DNS label.
 * @example
 * tunnelIngress({ label: "akouta", zone: "figentra.cloud", ports: { console: 5173 } });
 * // [{ hostname: "console-akouta.figentra.cloud", service: "http://localhost:5173" }, { service: "http_status:404" }]
 */
export function tunnelIngress(tunnel: {
  readonly label: string;
  readonly zone: string;
  readonly ports: Readonly<Record<string, number>>;
  readonly members?: readonly string[] | undefined;
}): TunnelIngressRule[] {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const members = tunnel.members ?? Object.keys(tunnel.ports).sort();
  const issues: RunwayIssue[] = [];
  const rules = members.map((member): TunnelIngressRule => {
    const label = `${member}-${tunnel.label}`;
    const port = tunnel.ports[member];
    if (port === undefined)
      issues.push({
        path: `tunnels.${tunnel.label}.members`,
        message: `${member} has no dev port in its runway`,
      });
    if (!DNS_LABEL_SCHEMA.safeParse(label).success)
      issues.push({
        path: `tunnels.${tunnel.label}`,
        message: `${label} is not one DNS label, so Universal SSL would not cover it (ADR 0290 decision 2)`,
      });
    return { hostname: `${label}.${tunnel.zone}`, service: `http://localhost:${port}` };
  });
  if (issues.length > 0) throw new CloudflareConfigInvalidError("cloudflare stack config", issues);
  return [...rules, { service: "http_status:404" }];
}
