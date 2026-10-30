/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/waterfall-chart` (Waterfall chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts wave 2).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Waterfall chart. */
export const FREE_WATERFALL_CHART: ComponentEntry = {
  slug: "waterfall-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "WaterfallChart",
  parts: ["WaterfallChart"],
  hero: {},
  examples: [{ id: "bridge", card: true }],
  related: ["free/bar-chart", "free/composed-chart", "free/kpi"],
  tokens: ["color.chart-ramp-1", "color.success", "color.danger"],
  keywords: ["waterfall", "bridge", "variance", "profit and loss"],
  status: "new",
};
