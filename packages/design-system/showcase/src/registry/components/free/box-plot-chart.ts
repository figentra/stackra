/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/box-plot-chart` (Box plot chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Box plot chart. */
export const FREE_BOX_PLOT_CHART: ComponentEntry = {
  slug: "box-plot-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "BoxPlotChart",
  parts: ["BoxPlotChart"],
  hero: {},
  examples: [{ id: "delivery", card: true }],
  related: ["free/histogram-chart", "free/range-bar-chart", "free/bar-chart"],
  tokens: ["color.chart-ramp-1", "color.muted", "color.surface"],
  keywords: ["box plot", "box and whisker", "quartiles", "median", "outliers", "distribution"],
  status: "new",
};
