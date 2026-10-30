/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/donut-chart` (Donut chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (Stackra's own charts).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Donut chart. */
export const FREE_DONUT_CHART: ComponentEntry = {
  slug: "donut-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DonutChart",
  parts: ["DonutChart"],
  hero: {},
  examples: [
    { id: "total", card: true },
    { id: "plain" },
  ],
  related: ["free/pie-chart", "free/radial-bar-chart", "free/progress-circle"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["donut", "doughnut", "ring", "share", "total"],
};
