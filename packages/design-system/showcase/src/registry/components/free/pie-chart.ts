/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/pie-chart` (Pie chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (Stackra's own charts).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Pie chart entry of the component registry. */
export const FREE_PIE_CHART: ComponentEntry = {
  slug: "pie-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PieChart",
  parts: ["PieChart"],
  hero: {},
  examples: [{ id: "simple", card: true }, { id: "legend" }],
  related: ["free/donut-chart", "free/radial-bar-chart", "free/bar-chart"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["pie", "share", "proportion"],
};
