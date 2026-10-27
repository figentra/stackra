/**
 * Stackra file contract:
 * Purpose: `cloudflareZone(args)`, one zone of the core stack: the zone itself, imported by its runway id and
 *          protected so no run deletes it; its DNS records (adopting hand-made ones by id); its Worker custom domains;
 *          the Cloudflare for SaaS fallback origin tenant hostnames point at; and the regional hostnames that keep a
 *          regulated market's hosts inside one region (data localisation).
 * Boundary: declares Pulumi resources only; the edge (settings, rulesets, bots) is `zoneEdge`'s. Tenant custom
 *           hostnames are created and deleted by the tenancy service at runtime (ADR 0276 decision 8), never here.
 *           Worker scripts and assets deploy from CI with wrangler (ADR 0284 decision 6); only their domains are here.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 6), ADR 0175 (decision 1), ADR 0290 (decisions 3, 15 and 19), ADR 0284
 *                     (decision 9), ADR 0276 (decision 4), ADR 0437 (decision 12), ADR 0353.
 */
import * as cloudflare from "@pulumi/cloudflare";

import type { EdgePolicy } from "#core/types/edge-policy.type";
import type { ZoneOptions } from "#core/types/zone-options.type";

/** The record types Cloudflare can proxy. */
const PROXIABLE = new Set(["A", "AAAA", "CNAME"]);

/**
 * The zone `name` and what sits on it.
 *
 * @param args - the account id, the zone name and its runway id (resolved), its stack options and the edge `proxy`
 *               rule, which decides whether an A, AAAA or CNAME record without `proxied` is proxied.
 * @example
 * const { zone } = cloudflareZone({ accountId, name: "figentra.com", zoneId, options, proxy: edge.proxy });
 */
export function cloudflareZone(args: {
  readonly accountId: string;
  readonly name: string;
  readonly zoneId: string;
  readonly options: ZoneOptions;
  readonly proxy: EdgePolicy["proxy"];
}) {
  const { accountId, name, zoneId, options } = args;
  const zone = new cloudflare.Zone(
    name,
    { account: { id: accountId }, name, type: "full" },
    { import: zoneId, protect: true },
  );
  const records = Object.entries(options.records).map(([key, record]) => {
    const proxied = PROXIABLE.has(record.type) && (record.proxied ?? args.proxy === "all");
    return new cloudflare.DnsRecord(
      `${name}-record-${key}`,
      {
        zoneId: zone.id,
        name: record.name === "@" ? name : `${record.name}.${name}`,
        type: record.type,
        content: record.content,
        proxied,
        ttl: proxied ? 1 : record.ttl,
        priority: record.priority,
        comment: record.comment,
      },
      record.import === undefined ? {} : { import: `${zoneId}/${record.import}` },
    );
  });
  const workers = Object.entries(options.workers).map(
    ([hostname, worker]) =>
      new cloudflare.WorkersCustomDomain(
        `${hostname}-worker`,
        { accountId, hostname, service: worker.service, zoneId: zone.id },
        worker.import === undefined ? {} : { import: `${accountId}/${worker.import}` },
      ),
  );
  const fallbackOrigin =
    options.fallbackOrigin === undefined
      ? undefined
      : new cloudflare.CustomHostnameFallbackOrigin(`${name}-fallback-origin`, {
          zoneId: zone.id,
          origin: options.fallbackOrigin,
        });
  const regional = Object.entries(options.regional).map(
    ([hostname, regionKey]) =>
      new cloudflare.RegionalHostname(`${hostname}-regional`, {
        zoneId: zone.id,
        hostname,
        regionKey,
      }),
  );
  return { zone, records, workers, fallbackOrigin, regional };
}
