/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/line-chart` (Line chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (Stackra's own charts).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Line chart. */
export const FREE_LINE_CHART: ComponentEntry = {
  slug: "line-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "LineChart",
  parts: ["LineChart"],
  hero: {},
  examples: [
    { id: "multiple", card: true },
    { id: "dots" },
    { id: "linear" },
  ],
  related: ["free/area-chart", "free/bar-chart", "free/sparkline"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["line", "trend", "time series"],
};
