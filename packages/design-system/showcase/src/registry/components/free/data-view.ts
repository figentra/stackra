/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/data-view` (Data view).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; data-collection plan (owner, 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Data view entry of the component registry. */
export const FREE_DATA_VIEW: ComponentEntry = {
  slug: "data-view",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DataView",
  parts: [
    "DataView",
    "CollectionFilterEditor",
    "CollectionSortEditor",
    "DataViewCards",
    "SavedViewsMenu",
  ],
  hero: {},
  examples: [
    { id: "basics", card: true, platforms: ["react"] },
    { id: "filters", platforms: ["react"] },
    { id: "group-by", platforms: ["react"] },
    { id: "saved-views", platforms: ["react"] },
    { id: "server", platforms: ["react"] },
    { id: "persistence", platforms: ["react"] },
    { id: "arabic", platforms: ["react"] },
    { id: "orders", platforms: ["native"] },
  ],
  related: ["free/data-table", "free/collection-engine", "free/data-grid"],
  tokens: ["color.surface", "color.border", "radius.container"],
  keywords: [
    "table",
    "grid",
    "list",
    "cards",
    "filter",
    "sort",
    "group",
    "saved views",
    "toolbar",
    "export",
  ],
  status: "new",
};
