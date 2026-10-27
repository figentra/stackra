/**
 * Stackra file contract:
 * Purpose: `matchesTier`: whether a page of `tier` shows under `filter`: `all` shows every page, `free` and `pro`
 *          their own tier.
 * Boundary: a pure function, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0305 (rule 10).
 */
import type { PageTier } from "./page-tier";
import type { TierFilter } from "./tier-filter.type";

/** Whether a page of `tier` shows under `filter`: `all` shows every page, `free` and `pro` their own tier. */
export function matchesTier(tier: PageTier, filter: TierFilter): boolean {
  return filter === "all" || tier.toLowerCase() === filter;
}
