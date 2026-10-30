/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/filter-panel` (Filter panel).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory (2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Filter panel entry of the component registry. */
export const FREE_FILTER_PANEL: ComponentEntry = {
  slug: "filter-panel",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FilterPanel",
  parts: ["FilterPanel"],
  hero: {},
  examples: [{ id: "orders", card: true }, { id: "products" }, { id: "tickets" }],
  related: ["free/filter-bar", "free/data-table", "free/tabs"],
  tokens: ["color.surface", "color.accent", "radius.base", "color.border"],
  keywords: ["facets", "filters", "saved views", "sort"],
};
