/**
 * Stackra file contract:
 * Purpose: `customHostnameRequest(call)`, the Cloudflare for SaaS custom-hostname calls the OS tenancy `domains` module
 *          makes for a scope's own domain: create (DV certificate validated by TXT, the scope id in the hostname's
 *          custom metadata so the edge and support can trace it), read (to poll the state) and delete (at once on
 *          removal, failure or expiry, so no hostname dangles).
 * Boundary: pure; describes the call, never sends it. Tenancy sends it with its own API token and keeps the hostname
 *           registry and ownership proof (ADR 0276 decisions 1 and 2); the SaaS zone and its fallback origin are this
 *           package's `cloudflareZone`.
 * Runtime: isomorphic
 * Governing contract: ADR 0276 (decisions 4 and 8), ADR 0437 (decision 10), owner decision D8 (custom domains day 1).
 */
import { HOSTNAME_SCHEMA } from "#core/constants/hostname-schema.constant";
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";
import type { CloudflareApiRequest } from "#core/types/cloudflare-api-request.type";

/** A Cloudflare id: no path separator, never empty. */
const ID = /^[A-Za-z0-9_-]+$/;

/**
 * The API call for `call` on the SaaS zone `call.zoneId`.
 *
 * @param call - `create` with the hostname, the owning scope's id and the minimum TLS version (`1.2` by default);
 *               `get` or `delete` with the custom hostname's Cloudflare id.
 * @throws CloudflareConfigInvalidError when the hostname is not a lower-case host name or an id is malformed.
 * @example
 * customHostnameRequest({ action: "create", zoneId, hostname: "shop.acme.example", scopeId: "scp_01J…" });
 * // { method: "POST", path: `/zones/${zoneId}/custom_hostnames`, body: { hostname: "shop.acme.example", ssl: … } }
 */
export function customHostnameRequest(
  call:
    | {
        readonly action: "create";
        readonly zoneId: string;
        readonly hostname: string;
        readonly scopeId: string;
        readonly minTlsVersion?: "1.2" | "1.3";
      }
    | {
        readonly action: "get" | "delete";
        readonly zoneId: string;
        readonly customHostnameId: string;
      },
): CloudflareApiRequest {
  const issues = [
    ...(ID.test(call.zoneId) ? [] : [{ path: "zoneId", message: "Expected a Cloudflare zone id" }]),
    ...(call.action === "create"
      ? [
          ...(HOSTNAME_SCHEMA.safeParse(call.hostname).success
            ? []
            : [{ path: "hostname", message: "Expected a lower-case host name" }]),
          ...(call.scopeId.length > 0
            ? []
            : [{ path: "scopeId", message: "Expected the owning scope's id" }]),
        ]
      : ID.test(call.customHostnameId)
        ? []
        : [{ path: "customHostnameId", message: "Expected a Cloudflare custom hostname id" }]),
  ];
  if (issues.length > 0) throw new CloudflareConfigInvalidError("custom hostname call", issues);

  const base = `/zones/${call.zoneId}/custom_hostnames`;
  if (call.action !== "create")
    return {
      method: call.action === "get" ? "GET" : "DELETE",
      path: `${base}/${call.customHostnameId}`,
    };
  return {
    method: "POST",
    path: base,
    body: {
      hostname: call.hostname,
      ssl: {
        method: "txt",
        type: "dv",
        settings: { min_tls_version: call.minTlsVersion ?? "1.2" },
      },
      custom_metadata: { scope: call.scopeId },
    },
  };
}
