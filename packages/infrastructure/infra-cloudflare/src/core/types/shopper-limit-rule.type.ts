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
  /** What Cloudflare does once the limit is hit. */
  readonly action: "block";
  /** The host-and-path filter the rule applies to. */
  readonly expression: string;
  /** The label the dashboard shows for the rule. */
  readonly description: string;
  /** The per-shopper rate limit, in Cloudflare's field names. */
  readonly ratelimit: {
    readonly characteristics: string[];
    readonly period: number;
    readonly requestsPerPeriod: number;
    readonly mitigationTimeout: number;
  };
};
