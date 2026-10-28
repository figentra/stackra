/**
 * Stackra file contract:
 * Purpose: `devTunnel(args)`, one machine's named Cloudflare Tunnel: the tunnel with its ingress held remotely, and a
 *          proxied CNAME per dev host to `<tunnel id>.cfargotunnel.com`, so `stackra dev --tunnel` only runs
 *          cloudflared and never holds a DNS-edit token.
 * Boundary: declares Pulumi resources only; the ingress comes from `tunnelIngress`. The tunnel token is never an output
 *           here: it reaches the machine from Infisical `/agents` through `infisical run` and never touches disk.
 *           Access in front of the hosts is `accessGate`'s. `edgeWorker` reuses it for a regional API origin's tunnel
 *           (ADR 0437 decision 5), with its own record comment.
 * Runtime: node
 * Governing contract: ADR 0290 (decisions 2, 4, 5 and 6).
 */
import * as cloudflare from "@pulumi/cloudflare";
import * as pulumi from "@pulumi/pulumi";

import type { TunnelIngressRule } from "#core/types/tunnel-ingress-rule.type";

/**
 * The tunnel `name` and its DNS records.
 *
 * @param args - the account id, the dev zone's id, the tunnel name (`<project>-<dev>`) and its ingress rules.
 * @example
 * devTunnel({ accountId, zoneId: devZone.id, name: "figentra-akouta", ingress: tunnelIngress({ … }) });
 */
export function devTunnel(args: {
  readonly accountId: string;
  readonly zoneId: pulumi.Input<string>;
  readonly name: string;
  readonly ingress: readonly TunnelIngressRule[];
  /** The DNS record comment; a dev tunnel's by default. */
  readonly comment?: string | undefined;
}): {
  tunnel: cloudflare.ZeroTrustTunnelCloudflared;
  config: cloudflare.ZeroTrustTunnelCloudflaredConfig;
  records: cloudflare.DnsRecord[];
} {
  const {
    accountId,
    zoneId,
    name,
    ingress,
    comment = `Dev tunnel ${name} (ADR 0290 decision 5)`,
  } = args;
  const tunnel = new cloudflare.ZeroTrustTunnelCloudflared(`tunnel-${name}`, {
    accountId,
    name,
    configSrc: "cloudflare",
  });
  const config = new cloudflare.ZeroTrustTunnelCloudflaredConfig(`tunnel-${name}-config`, {
    accountId,
    tunnelId: tunnel.id,
    config: { ingresses: ingress.map((rule) => ({ ...rule })) },
  });
  const records = ingress.flatMap((rule) =>
    rule.hostname === undefined
      ? []
      : [
          new cloudflare.DnsRecord(`tunnel-${name}-${rule.hostname}`, {
            zoneId,
            name: rule.hostname,
            type: "CNAME",
            content: pulumi.interpolate`${tunnel.id}.cfargotunnel.com`,
            proxied: true,
            ttl: 1,
            comment,
          }),
        ],
  );
  return { tunnel, config, records };
}
