/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/import-dialog` (Import dialog).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Import dialog. */
export const FREE_IMPORT_DIALOG: ComponentEntry = {
  slug: "import-dialog",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ImportDialog",
  parts: ["ImportDialog"],
  hero: {},
  examples: [{ id: "customers", card: true }, { id: "errors" }, { id: "large" }],
  related: ["free/export-dialog", "free/import-flow", "free/drop-zone"],
  tokens: ["color.overlay", "color.danger", "color.success", "color.separator"],
  keywords: ["import", "upload", "csv", "excel", "spreadsheet", "mapping", "dry run", "errors"],
  status: "new",
};
