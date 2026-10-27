/**
 * Stackra file contract:
 * Purpose: `PageTier`, the tier of a playground page. A page is Pro when its path starts with `/pro-` (the
 *          `@stackra-pro/ui` pages, ADR 0310); every other page is Free (`tierOf`). The tier is derived from the path,
 *          never declared on a route.
 * Boundary: a type only; no discovery, so the shell can import it without loading the pages.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6).
 */
/** The tier of a page: Free for a `@stackra/ui` page, Pro for a `@stackra-pro/ui` one. */
export type PageTier = "Free" | "Pro";
