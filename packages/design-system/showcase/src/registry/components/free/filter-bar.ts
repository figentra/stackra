/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/filter-bar` (Filter bar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Filter bar. */
export const FREE_FILTER_BAR: ComponentEntry = {
  slug: "filter-bar",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FilterBar",
  parts: ["FilterBar"],
  hero: {},
  examples: [
    { id: "basics", platforms: ["react"], card: true },
    { id: "kinds" },
    { id: "states", platforms: ["react"] },
    { id: "live", platforms: ["react"] },
    { id: "applied", platforms: ["native"] },
    { id: "refused", platforms: ["native"] },
  ],
  related: ["free/data-table", "free/chip", "free/list"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["filters", "facets", "search"],
};
