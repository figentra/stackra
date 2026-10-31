/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/chart-export` (Chart export).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (gap wave, owner approval 2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Chart export entry of the component registry. */
export const FREE_CHART_EXPORT: ComponentEntry = {
  slug: "chart-export",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ChartExport",
  parts: ["ChartExport"],
  hero: {},
  examples: [{ id: "sales", card: true }, { id: "csv-only" }],
  related: ["free/widget-frame", "free/bar-chart", "free/export-dialog"],
  tokens: ["color.surface"],
  keywords: ["export", "download", "png", "svg", "csv", "share", "save chart"],
  status: "new",
};
