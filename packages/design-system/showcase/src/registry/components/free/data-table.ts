/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/data-table` (Data table).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Data table entry of the component registry. */
export const FREE_DATA_TABLE: ComponentEntry = {
  slug: "data-table",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DataTable",
  parts: [
    "DataTable",
    "ColumnEditor",
    "ColumnMenu",
    "SavedViews",
    "SavedViewsMenu",
    "ColumnChooser",
  ],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "sorting", platforms: ["react"] },
    { id: "row-actions" },
    { id: "selection" },
    { id: "filter-slot", platforms: ["react"] },
    { id: "states" },
    { id: "paging", platforms: ["react"] },
    { id: "live" },
    { id: "grouped" },
    { id: "tools" },
    { id: "column-editor", platforms: ["react"] },
    { id: "reorder-resize", platforms: ["react"] },
    { id: "pinned", platforms: ["react"] },
    { id: "density", platforms: ["react"] },
    { id: "aggregates", platforms: ["react"] },
    { id: "multi-sort", platforms: ["react"] },
  ],
  related: ["free/data-view", "free/collection-engine", "free/data-grid"],
  tokens: ["color.surface", "radius.base", "color.border"],
  keywords: ["grid", "rows", "sort", "table", "columns", "pin", "resize", "density", "totals"],
};
