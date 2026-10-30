/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/choropleth-map` (Choropleth map).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Choropleth map entry of the component registry. */
export const FREE_CHOROPLETH_MAP: ComponentEntry = {
  slug: "choropleth-map",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ChoroplethMap",
  parts: ["ChoroplethMap"],
  hero: {},
  examples: [{ id: "districts", card: true }],
  related: ["free/treemap-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5", "color.surface"],
  keywords: ["map", "choropleth", "regions", "geography", "geojson"],
  status: "new",
};
