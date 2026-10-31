/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/word-cloud` (Word cloud).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap wave, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Word cloud entry of the component registry. */
export const FREE_WORD_CLOUD: ComponentEntry = {
  slug: "word-cloud",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "WordCloud",
  parts: ["WordCloud"],
  hero: {},
  examples: [{ id: "reviews", card: true }],
  related: ["free/bar-list", "free/treemap-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5"],
  keywords: ["word cloud", "tag cloud", "text", "keywords", "mentions"],
  status: "new",
  advanced: true,
};
