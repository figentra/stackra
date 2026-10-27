/**
 * Stackra file contract:
 * Purpose: `cloudflareCoreStack(args)`, the Cloudflare half of the core Pulumi stack in one call: every zone the root
 *          runway names (imported, with its records, Worker domains and SaaS fallback origin), the runway edge on each
 *          edge zone with any storefront's waiting rooms and per-shopper limits, a named tunnel per machine on the dev
 *          zone, the Access gate, the R2 buckets and the OS edge Worker's KV, routes, rollout and origin locks. Returns
 *          every
 *          resource it declared, so the stacks repository exports the ids it needs.
 * Boundary: the program body only. The stacks repository (`figentra/infra`) owns `Pulumi.yaml`, the stack config and
 *           the state; the owner runs `pulumi up` there, and agents only preview (ADR 0171). The account and zone ids
 *           come from the root runway (`providers.cloudflare`), resolved through `ref:`; nothing here reads a secret.
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 2, 6 and 7), ADR 0175, ADR 0290 (decisions 1 to 6, 11, 13 and 15), ADR 0026,
 *                     ADR 0284 (decision 9), ADR 0217 (decision 3), ADR 0325 (rule 24), ADR 0402 (storefront edge),
 *                     ADR 0437 (the edge Worker).
 */
import type { RootRunway, RunwayIssue } from "@stackra/runway";

import { ZONE_OPTIONS_SCHEMA } from "#core/constants/zone-options-schema.constant";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import { parseEdge } from "#core/functions/parse-edge.function";
import { tunnelIngress } from "#core/functions/tunnel-ingress.function";
import { zoneOf } from "#core/functions/zone-of.function";
import type { CloudflareStack } from "#core/types/cloudflare-stack.type";
import type { StorefrontPolicy } from "#core/types/storefront-policy.type";
import { accessGate } from "#node/functions/access-gate.function";
import { cloudflareZone } from "#node/functions/cloudflare-zone.function";
import { devTunnel } from "#node/functions/dev-tunnel.function";
import { edgeWorker } from "#node/functions/edge-worker.function";
import { r2Bucket } from "#node/functions/r2-bucket.function";
import { resolveRef } from "#node/functions/resolve-ref.function";
import { storefrontEdge } from "#node/functions/storefront-edge.function";
import { zoneEdge } from "#node/functions/zone-edge.function";

/**
 * The Cloudflare resources of the core stack.
 *
 * @param args - the parsed root runway, the parsed stack config, the members' dev ports (`devPortsOf`), which the
 *               tunnels expose, and each storefront's policy (`parseStorefront`) by the edge zone it is served on.
 * @throws CloudflareConfigInvalidError when the runway names no Cloudflare account, the stack config lists a zone the
 *         runway does not, a storefront is on a zone that is not an edge zone or names a host outside it, a `ref:` is
 *         unset, the edge block is invalid, a tunnel host breaks the one-label rule, or an edge Worker route zone or
 *         origin host is not a runway zone's.
 * @example
 * // figentra/infra, cloudflare/index.ts
 * const root = readRunway("runway.yaml", "root");
 * const stack = parseCloudflareStack(new pulumi.Config().requireObject("infra-cloudflare"));
 * const cloudflare = cloudflareCoreStack({ root, stack, ports: devPortsOf(memberRunways) });
 * export const tunnelIds = Object.fromEntries(Object.entries(cloudflare.tunnels).map(([dev, t]) => [dev, t.tunnel.id]));
 */
export function cloudflareCoreStack(args: {
  readonly root: RootRunway;
  readonly stack: CloudflareStack;
  readonly ports?: Readonly<Record<string, number>> | undefined;
  readonly storefront?: Readonly<Record<string, StorefrontPolicy>> | undefined;
}) {
  const { root, stack, ports = {}, storefront = {} } = args;
  const provider = root.providers?.cloudflare;
  const runwayZones = provider?.zones ?? {};
  const issues: RunwayIssue[] = [];
  if (provider?.accountId === undefined)
    issues.push({
      path: "providers.cloudflare.accountId",
      message: "The Cloudflare account is not named",
    });
  for (const zone of new Set([
    ...Object.keys(stack.zones),
    ...(stack.devZone === undefined ? [] : [stack.devZone]),
  ]))
    if (!(zone in runwayZones))
      issues.push({
        path: `providers.cloudflare.zones.${zone}`,
        message: `${zone} is in the stack config but the root runway does not name it`,
      });
  for (const [zone, policy] of Object.entries(storefront)) {
    if (!(zone in runwayZones) || stack.zones[zone]?.edge === false)
      issues.push({
        path: `storefront.${zone}`,
        message: `${zone} is not an edge zone of the runway: a storefront's limits ride its edge`,
      });
    for (const [key, campaign] of Object.entries(policy.campaigns))
      if (campaign.host !== zone && !campaign.host.endsWith(`.${zone}`))
        issues.push({
          path: `storefront.${zone}.campaigns.${key}.host`,
          message: `${campaign.host} is not under ${zone}`,
        });
  }
  for (const zone of Object.keys(stack.edgeWorker?.routes ?? {}))
    if (!(zone in runwayZones))
      issues.push({
        path: `edgeWorker.routes.${zone}`,
        message: `${zone} is not a zone the root runway names`,
      });
  for (const [region, origin] of Object.entries(stack.edgeWorker?.origins ?? {}))
    if (zoneOf(origin.hostname, Object.keys(runwayZones)) === undefined)
      issues.push({
        path: `edgeWorker.origins.${region}.hostname`,
        message: `${origin.hostname} is under no zone the root runway names`,
      });
  if (provider?.accountId === undefined || issues.length > 0)
    throw new CloudflareConfigInvalidError("runway.yaml", issues);

  const accountId = resolveRef(provider.accountId, "providers.cloudflare.accountId");
  const edge = parseEdge(root);
  const zones = Object.fromEntries(
    Object.entries(runwayZones).map(([name, id]) => {
      const options = stack.zones[name] ?? ZONE_OPTIONS_SCHEMA.parse({});
      const zoneId = resolveRef(id, `providers.cloudflare.zones.${name}`);
      const zone = cloudflareZone({ accountId, name, zoneId, options, proxy: edge.proxy });
      const policy = storefront[name];
      const shop =
        options.edge && policy !== undefined
          ? storefrontEdge({ name, zoneId: zone.zone.id, policy })
          : undefined;
      const edgeResources = options.edge
        ? zoneEdge({
            name,
            zoneId: zone.zone.id,
            plan: options.plan,
            edge,
            shopperRules: shop?.rules,
          })
        : undefined;
      return [name, { ...zone, edge: edgeResources, storefront: shop?.rooms }] as const;
    }),
  );

  // The schema requires the dev zone for tunnels and Access, and the check above that the runway names it.
  const devZoneId = stack.devZone === undefined ? undefined : zones[stack.devZone]?.zone.id;
  const dev =
    stack.devZone === undefined || devZoneId === undefined
      ? undefined
      : { name: stack.devZone, zoneId: devZoneId };
  const tunnels = Object.fromEntries(
    Object.entries(stack.tunnels).flatMap(([label, tunnel]) =>
      dev === undefined
        ? []
        : [
            [
              label,
              devTunnel({
                accountId,
                zoneId: dev.zoneId,
                name: `${root.project}-${label}`,
                ingress: tunnelIngress({ label, zone: dev.name, ports, members: tunnel.members }),
              }),
            ] as const,
          ],
    ),
  );
  const access =
    stack.access === undefined || dev === undefined
      ? undefined
      : accessGate({
          accountId,
          project: root.project,
          devZone: dev.name,
          identityProviderId: resolveRef(
            stack.access.identityProviderId,
            "access.identityProviderId",
          ),
          access: stack.access,
        });
  const buckets = Object.fromEntries(
    Object.entries(stack.buckets).map(
      ([name, bucket]) =>
        [name, r2Bucket({ accountId, name, expireDays: bucket.expireDays })] as const,
    ),
  );
  const edgeWorkerResources =
    stack.edgeWorker === undefined
      ? undefined
      : edgeWorker({
          accountId,
          project: root.project,
          zoneIds: Object.fromEntries(
            Object.entries(zones).map(([name, zone]) => [name, zone.zone.id]),
          ),
          worker: stack.edgeWorker,
        });
  return { zones, tunnels, access, buckets, edgeWorker: edgeWorkerResources };
}
