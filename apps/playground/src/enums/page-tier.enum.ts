/**
 * Stackra file contract:
 * Purpose: the tiers a playground page belongs to: Free (`@stackra/ui`) and Pro (`@stackra/ui-pro`). Inside each
 *          category the free pages come first, then the Pro ones with a "Pro" badge, and the index page filters by
 *          tier (All, Free, Pro). The tier is a badge, not a category.
 * Boundary: the values only; `playground-pages` derives a page's tier from its path (`/pro-*` is Pro).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14).
 */

/** The page tiers, free first. */
// shortcut: a frozen tuple of English labels until @stackra/contracts ships Enum.of (ADR 0128) and @stackra/i18n
// ships; then `playground::tier.*` keys.
export const PageTier = Object.freeze(["Free", "Pro"] as const);

/** One page tier. */
export type PageTier = (typeof PageTier)[number];
