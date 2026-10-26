/**
 * Stackra file contract:
 * Purpose: `ShopperLimitRule`, one per-shopper limit as a Cloudflare `http_ratelimit` ruleset rule: the action, the
 *          host-and-path expression, a description and the per-shopper rate limit.
 * Boundary: type only; `shopperLimitRules` builds it and `zoneEdge` hands it to the ruleset as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0402.
 */

/** One per-shopper rule. */
export type ShopperLimitRule = {
  readonly action: "block";
  readonly expression: string;
  readonly description: string;
  readonly ratelimit: {
    readonly characteristics: string[];
    readonly period: number;
    readonly requestsPerPeriod: number;
    readonly mitigationTimeout: number;
  };
};
