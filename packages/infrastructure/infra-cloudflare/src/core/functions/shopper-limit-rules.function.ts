/**
 * Stackra file contract:
 * Purpose: `shopperLimitRules(policy)`, the edge rate-limit rules of a storefront's hot items: one rule per campaign
 *          limit, matching the campaign's host and the item's path prefix and counting per shopper (the storefront's
 *          cookie or header, per Cloudflare data centre), blocking a shopper past `requests` per `periodSeconds` for
 *          one period.
 * Boundary: pure; `zoneEdge` adds the rules to the zone's `http_ratelimit` entry point after the coarse per-IP rule.
 *           The values are validated paths and names, so the expression holds no quote from the input.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (per-shopper limits on hot items), ADR 0217 (decision 2).
 */
import type { ShopperLimitRule } from "#core/types/shopper-limit-rule.type";
import type { StorefrontPolicy } from "#core/types/storefront-policy.type";

/**
 * The rules of `policy`, campaign by campaign, limit by limit.
 *
 * @example
 * shopperLimitRules(storefront)[0]?.expression;
 * // '(http.host eq "shop.acme.example" and starts_with(http.request.uri.path, "/products/drop-1"))'
 */
export function shopperLimitRules(policy: StorefrontPolicy): ShopperLimitRule[] {
  const field = policy.shopper.by === "cookie" ? "http.request.cookies" : "http.request.headers";
  // Cloudflare lower-cases header names in `http.request.headers`; cookie names keep their case.
  const name =
    policy.shopper.by === "cookie" ? policy.shopper.name : policy.shopper.name.toLowerCase();
  const shopper = `${field}["${name}"]`;
  return Object.entries(policy.campaigns).flatMap(([key, campaign]) =>
    campaign.limits.map((limit) => ({
      action: "block" as const,
      expression: `(http.host eq "${campaign.host}" and starts_with(http.request.uri.path, "${limit.path}"))`,
      description: `${key}: ${limit.requests} per ${limit.periodSeconds}s per shopper on ${limit.path}`,
      ratelimit: {
        characteristics: ["cf.colo.id", shopper],
        period: limit.periodSeconds,
        requestsPerPeriod: limit.requests,
        mitigationTimeout: limit.periodSeconds,
      },
    })),
  );
}
