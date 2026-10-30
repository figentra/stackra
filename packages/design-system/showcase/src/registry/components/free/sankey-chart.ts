/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/sankey-chart` (Sankey chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Sankey chart entry of the component registry. */
export const FREE_SANKEY_CHART: ComponentEntry = {
  slug: "sankey-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SankeyChart",
  parts: ["SankeyChart"],
  hero: {},
  examples: [{ id: "traffic", card: true }],
  related: ["free/funnel-chart", "free/treemap-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5", "color.surface"],
  keywords: ["sankey", "flow", "journey", "source to outcome", "alluvial"],
  status: "new",
  advanced: true,
};
