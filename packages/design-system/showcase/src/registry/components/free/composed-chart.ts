/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/composed-chart` (Composed chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Composed chart. */
export const FREE_COMPOSED_CHART: ComponentEntry = {
  slug: "composed-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ComposedChart",
  parts: ["ComposedChart"],
  hero: {},
  examples: [{ id: "revenue-target", card: true }],
  related: ["free/bar-chart", "free/line-chart", "free/area-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-2", "color.muted"],
  keywords: ["composed", "combo", "bar and line", "mixed chart", "target"],
  status: "new",
};
