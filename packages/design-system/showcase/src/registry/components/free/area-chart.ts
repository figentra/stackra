/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/area-chart` (Area chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (Stackra's own charts).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Area chart entry of the component registry. */
export const FREE_AREA_CHART: ComponentEntry = {
  slug: "area-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AreaChart",
  parts: ["AreaChart"],
  hero: {},
  examples: [
    { id: "interactive", card: true },
    { id: "stacked" },
    { id: "step" },
    { id: "axes" },
    { id: "percent" },
  ],
  related: ["free/line-chart", "free/bar-chart", "free/sparkline"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["area", "trend", "time series", "filled line"],
};
