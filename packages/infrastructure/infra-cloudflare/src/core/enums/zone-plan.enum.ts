/**
 * Stackra file contract:
 * Purpose: `ZonePlan`, the Cloudflare plan a zone is on, which decides the managed WAF ruleset, the bot protection
 *          and the rate-limit windows the edge program may use.
 * Boundary: an `Enum.of` value plus the type of the same name. The plan is bought by the owner and stated in the stack
 *           config; no program changes a zone's plan.
 * Runtime: isomorphic
 * Governing contract: ADR 0290 (decision 13: Free until the first public API, then Pro), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per plan the edge program supports. */
export const ZonePlan = Enum.of({
  /** The Free plan: the Free Managed Ruleset, Bot Fight Mode and 10-second rate-limit windows. */
  Free: "free",
  /** The Pro plan: the Cloudflare Managed Ruleset, Super Bot Fight Mode and windows up to one minute. */
  Pro: "pro",
});

/** One of the codes above. */
export type ZonePlan = Enum.Value<typeof ZonePlan>;
