/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/treemap-chart` (Treemap chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Treemap chart. */
export const FREE_TREEMAP_CHART: ComponentEntry = {
  slug: "treemap-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TreemapChart",
  parts: ["TreemapChart"],
  hero: {},
  examples: [{ id: "categories", card: true }],
  related: ["free/pie-chart", "free/donut-chart", "free/stacked-meter"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5", "color.surface"],
  keywords: ["treemap", "share", "hierarchy", "category mix", "proportion"],
  status: "new",
};
