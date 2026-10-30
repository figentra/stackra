/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/bar-list` (Bar list).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Bar list. */
export const FREE_BAR_LIST: ComponentEntry = {
  slug: "bar-list",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "BarList",
  parts: ["BarList"],
  hero: {},
  examples: [
    { id: "cities", card: true },
    { id: "sources" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/bar-chart", "free/stacked-meter", "free/kpi"],
  tokens: ["color.accent-soft", "radius.control"],
  keywords: ["bar list", "ranking", "top 5", "leaderboard", "breakdown", "sources"],
  status: "new",
};
