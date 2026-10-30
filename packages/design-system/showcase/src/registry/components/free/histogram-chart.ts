/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/histogram-chart` (Histogram chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Histogram chart entry of the component registry. */
export const FREE_HISTOGRAM_CHART: ComponentEntry = {
  slug: "histogram-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "HistogramChart",
  parts: ["HistogramChart"],
  hero: {},
  examples: [{ id: "orders", card: true }],
  related: ["free/bar-chart", "free/box-plot-chart", "free/area-chart"],
  tokens: ["color.chart-ramp-1", "color.muted", "color.surface"],
  keywords: ["histogram", "distribution", "frequency", "bins", "spread"],
  status: "new",
};
