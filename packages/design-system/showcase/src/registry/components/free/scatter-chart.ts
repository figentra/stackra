/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/scatter-chart` (Scatter chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts wave 2).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Scatter chart entry of the component registry. */
export const FREE_SCATTER_CHART: ComponentEntry = {
  slug: "scatter-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ScatterChart",
  parts: ["ScatterChart"],
  hero: {},
  examples: [{ id: "bubbles", card: true }, { id: "points" }],
  related: ["free/line-chart", "free/heatmap-chart", "free/bar-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-2", "color.surface"],
  keywords: ["scatter", "bubble", "correlation", "xy plot", "points"],
  status: "new",
};
