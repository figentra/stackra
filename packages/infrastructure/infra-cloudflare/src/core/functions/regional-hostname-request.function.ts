/**
 * Stackra file contract:
 * Purpose: `regionalHostnameRequest(call)`, the Cloudflare regional-services call that keeps a scope's custom hostname
 *          inside one region (only that region's points of presence terminate its TLS and see its traffic), or
 *          releases it: the per-host data-localisation option for regulated markets such as KSA.
 * Boundary: pure; describes the call, never sends it. Whether a market needs it, and which region key, is the market
 *           pack's launch-gate answer (counsel and infrastructure, ADR 0437 decision 12); nothing here decides it.
 *           Platform hosts take the same option declaratively through a zone's `regional` stack config.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 12), ADR 0353 (data residency), ADR 0354.
 */
import { HOSTNAME_SCHEMA } from "#core/constants/hostname-schema.constant";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import type { CloudflareApiRequest } from "#core/types/cloudflare-api-request.type";

/**
 * The API call for `call` on the zone `call.zoneId`.
 *
 * @param call - `create` with the hostname and the region key the market pack names; `delete` with the hostname.
 * @throws CloudflareConfigInvalidError when the zone id, hostname or region key is malformed.
 * @example
 * regionalHostnameRequest({ action: "create", zoneId, hostname: "shop.acme.example", regionKey: "eu" });
 * // { method: "POST", path: `/zones/${zoneId}/addressing/regional_hostnames`, body: { hostname, region_key: "eu" } }
 */
export function regionalHostnameRequest(
  call:
    | {
        readonly action: "create";
        readonly zoneId: string;
        readonly hostname: string;
        readonly regionKey: string;
      }
    | { readonly action: "delete"; readonly zoneId: string; readonly hostname: string },
): CloudflareApiRequest {
  const issues = [
    ...(/^[A-Za-z0-9_-]+$/.test(call.zoneId)
      ? []
      : [{ path: "zoneId", message: "Expected a Cloudflare zone id" }]),
    ...(HOSTNAME_SCHEMA.safeParse(call.hostname).success
      ? []
      : [{ path: "hostname", message: "Expected a lower-case host name" }]),
    ...(call.action === "create" && !/^[a-z0-9_-]+$/.test(call.regionKey)
      ? [{ path: "regionKey", message: "Expected a Cloudflare region key such as eu" }]
      : []),
  ];
  if (issues.length > 0) throw new CloudflareConfigInvalidError("regional hostname call", issues);

  const base = `/zones/${call.zoneId}/addressing/regional_hostnames`;
  return call.action === "delete"
    ? { method: "DELETE", path: `${base}/${call.hostname}` }
    : { method: "POST", path: base, body: { hostname: call.hostname, region_key: call.regionKey } };
}
