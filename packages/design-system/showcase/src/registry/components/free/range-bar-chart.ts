/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/range-bar-chart` (Range bar chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Range bar chart. */
export const FREE_RANGE_BAR_CHART: ComponentEntry = {
  slug: "range-bar-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RangeBarChart",
  parts: ["RangeBarChart"],
  hero: {},
  examples: [{ id: "temperature", card: true }, { id: "prices" }],
  related: ["free/bar-chart", "free/box-plot-chart", "free/bullet-chart"],
  tokens: ["color.chart-ramp-1", "color.muted", "color.surface"],
  keywords: ["range bar", "floating bar", "min max", "low high", "span"],
  status: "new",
};
