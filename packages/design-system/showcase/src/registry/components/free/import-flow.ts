/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/import-flow` (Import flow).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Import flow. */
export const FREE_IMPORT_FLOW: ComponentEntry = {
  slug: "import-flow",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ImportFlow",
  parts: ["ImportFlow"],
  hero: {},
  examples: [{ id: "customers", card: true }],
  related: ["free/import-dialog", "free/export-dialog", "free/file-trigger"],
  tokens: ["color.danger", "color.success", "color.separator"],
  keywords: ["import", "csv", "spreadsheet", "mapping", "dry run", "upload"],
  status: "new",
};
