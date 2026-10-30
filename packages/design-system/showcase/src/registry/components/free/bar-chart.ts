/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/bar-chart` (Bar chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (Stackra's own charts).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Bar chart. */
export const FREE_BAR_CHART: ComponentEntry = {
  slug: "bar-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "BarChart",
  parts: ["BarChart"],
  hero: {},
  examples: [
    { id: "multiple", card: true },
    { id: "stacked" },
    { id: "horizontal" },
    { id: "percent" },
    { id: "single" },
  ],
  related: ["free/line-chart", "free/area-chart", "free/pie-chart"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["bar", "column", "histogram", "grouped", "stacked"],
};
