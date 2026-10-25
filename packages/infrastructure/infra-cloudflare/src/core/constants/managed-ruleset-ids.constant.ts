/**
 * Stackra file contract:
 * Purpose: `MANAGED_RULESET_IDS`, the Cloudflare managed WAF ruleset each zone plan runs: the Free Managed Ruleset on
 *          Free (the only one Free allows) and the Cloudflare Managed Ruleset on Pro.
 * Boundary: internal; `zoneEdge` executes the id in the zone's `http_request_firewall_managed` phase. The ids are
 *           Cloudflare's published, account-independent ruleset ids, not secrets.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 3), ADR 0290 (decision 13: Free until the first public API, then Pro for the
 *                     managed rules).
 */
import type { ZonePlan } from "#core/enums/zone-plan.enum";

/** Plan → the managed ruleset id it executes. */
export const MANAGED_RULESET_IDS: Readonly<Record<ZonePlan, string>> = Object.freeze({
  free: "77454fe2d30c4220b5701f6fdfb893ba",
  pro: "efb7b8c949ac4650a09736fc376e9aee",
});
