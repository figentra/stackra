/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/data-grid` (Data grid).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0317 amendment 2026-10-28 (wave 3d).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Data grid entry of the component registry. */
export const FREE_DATA_GRID: ComponentEntry = {
  slug: "data-grid",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DataGrid",
  parts: ["DataGrid"],
  hero: {},
  examples: [
    { id: "sheet", card: true },
    { id: "matrix" },
    { id: "column-tools", platforms: ["react"] },
    { id: "column-editor", platforms: ["native"] },
    { id: "virtual", platforms: ["react"] },
  ],
  related: ["free/data-table", "free/data-view", "free/save-bar"],
  tokens: ["color.surface", "color.border", "color.accent"],
  keywords: ["spreadsheet", "excel", "grid", "bulk edit", "paste", "matrix", "virtual scrolling"],
  status: "new",
};
