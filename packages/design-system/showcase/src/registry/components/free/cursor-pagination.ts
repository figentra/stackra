/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/cursor-pagination` (Cursor pagination).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Cursor pagination. */
export const FREE_CURSOR_PAGINATION: ComponentEntry = {
  slug: "cursor-pagination",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CursorPagination",
  parts: ["CursorPagination"],
  hero: {},
  examples: [
    { id: "pager" },
    { id: "more" },
    { id: "sizes" },
    { id: "count", card: true },
    { id: "live" },
  ],
  related: ["free/breadcrumbs", "free/link", "free/navigation-header"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  keywords: ["paging", "pages", "next", "previous"],
};
