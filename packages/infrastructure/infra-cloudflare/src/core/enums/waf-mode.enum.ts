/**
 * Stackra file contract:
 * Purpose: `WafMode`, the root runway's `edge.waf`: whether every edge zone runs Cloudflare's managed WAF ruleset.
 * Boundary: an `Enum.of` value plus the type of the same name; which ruleset a plan runs is `zoneEdge`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 3: the Cloudflare WAF of ADR 0038 carries forward), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per WAF mode. */
export const WafMode = Enum.of({
  /** The plan's managed ruleset runs on every request of the zone. */
  Managed: "managed",
  /** No managed ruleset is deployed by the program. */
  Off: "off",
});

/** One of the codes above. */
export type WafMode = Enum.Value<typeof WafMode>;
