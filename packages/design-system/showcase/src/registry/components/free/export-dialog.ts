/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/export-dialog` (Export dialog).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; GAPS.md row 16.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Export dialog entry of the component registry. */
export const FREE_EXPORT_DIALOG: ComponentEntry = {
  slug: "export-dialog",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ExportDialog",
  parts: ["ExportDialog"],
  hero: {},
  examples: [{ id: "orders", card: true }, { id: "delivery" }, { id: "failure" }],
  related: ["free/import-dialog", "free/data-table", "free/bulk-action-bar"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  keywords: ["export", "download", "csv", "excel", "email"],
};
