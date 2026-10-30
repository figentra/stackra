/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/sortable-list` (Sortable list).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; design-system gap inventory (2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Sortable list entry of the component registry. */
export const FREE_SORTABLE_LIST: ComponentEntry = {
  slug: "sortable-list",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SortableList",
  parts: ["SortableList"],
  hero: {},
  examples: [{ id: "menu", card: true }, { id: "checkout" }, { id: "widgets" }],
  related: ["free/list", "free/table", "free/property-list"],
  tokens: ["color.surface", "color.accent", "radius.base", "color.border"],
  haptics: [
    { event: "pickup", style: "impact" },
    { event: "move", style: "selection" },
  ],
  keywords: ["reorder", "drag", "sortable"],
};
