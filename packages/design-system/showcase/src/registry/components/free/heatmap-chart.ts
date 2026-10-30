/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/heatmap-chart` (Heatmap chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts wave 2).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Heatmap chart. */
export const FREE_HEATMAP_CHART: ComponentEntry = {
  slug: "heatmap-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "HeatmapChart",
  parts: ["HeatmapChart"],
  hero: {},
  examples: [{ id: "hours", card: true }],
  related: ["free/calendar-heatmap", "free/treemap-chart", "free/bar-chart"],
  tokens: ["color.chart-ramp-1", "color.surface"],
  keywords: ["heatmap", "matrix", "grid", "density", "busy hours"],
  status: "new",
};
