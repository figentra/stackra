/**
 * Stackra file contract:
 * Purpose: the tier of a playground page and the navigation's tier filter. A page is Pro when its path starts with
 *          `/pro-` (the `@stackra/ui-pro` pages, ADR 0310); every other page is Free. The tier is derived from the
 *          path, never declared on a route.
 * Boundary: pure functions and one frozen tuple; no discovery, so the shell can import it without loading the pages.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6).
 */

/** The values of the navigation's tier filter, in the order the control shows them. */
export const TIER_FILTERS = Object.freeze(["all", "free", "pro"] as const);

/** One tier filter value. */
export type TierFilter = (typeof TIER_FILTERS)[number];

/** The tier of a page: Free for a `@stackra/ui` page, Pro for a `@stackra/ui-pro` one. */
export type PageTier = "Free" | "Pro";

/** The tier of the page at `path`: Pro when it starts with `/pro-`, else Free. */
export function tierOf(path: string): PageTier {
  return path.startsWith("/pro-") ? "Pro" : "Free";
}

/** Whether a page of `tier` shows under `filter`: `all` shows every page, `free` and `pro` their own tier. */
export function matchesTier(tier: PageTier, filter: TierFilter): boolean {
  return filter === "all" || tier.toLowerCase() === filter;
}
