/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/sunburst-chart` (Sunburst chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Sunburst chart entry of the component registry. */
export const FREE_SUNBURST_CHART: ComponentEntry = {
  slug: "sunburst-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SunburstChart",
  parts: ["SunburstChart"],
  hero: {},
  examples: [{ id: "categories", card: true }],
  related: ["free/donut-chart", "free/treemap-chart", "free/pie-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5", "color.surface"],
  keywords: ["sunburst", "hierarchy", "nested share", "rings"],
  status: "new",
  advanced: true,
};
