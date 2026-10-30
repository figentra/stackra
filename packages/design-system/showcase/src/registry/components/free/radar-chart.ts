/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/radar-chart` (Radar chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (Stackra's own charts).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Radar chart. */
export const FREE_RADAR_CHART: ComponentEntry = {
  slug: "radar-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RadarChart",
  parts: ["RadarChart"],
  hero: {},
  examples: [
    { id: "single", card: true },
    { id: "multiple" },
  ],
  related: ["free/bar-chart", "free/line-chart", "free/radial-bar-chart"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["radar", "spider", "web", "polar"],
};
