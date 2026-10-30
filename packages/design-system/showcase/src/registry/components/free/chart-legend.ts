/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/chart-legend` (Chart legend).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ChartLegend entry of the component registry. */
export const FREE_CHART_LEGEND: ComponentEntry = {
  slug: "chart-legend",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ChartLegend",
  parts: ["ChartLegend"],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "toggles", platforms: ["react"] },
  ],
  related: ["free/bar-chart", "free/line-chart", "free/chart-tooltip"],
  tokens: ["color.muted", "color.focus"],
  keywords: ["legend", "series", "chart key", "toggle series"],
  status: "new",
};
