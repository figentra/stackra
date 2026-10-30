/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/gauge-chart` (Gauge chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts wave 2).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Gauge chart entry of the component registry. */
export const FREE_GAUGE_CHART: ComponentEntry = {
  slug: "gauge-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "GaugeChart",
  parts: ["GaugeChart"],
  hero: {},
  examples: [{ id: "target", card: true }],
  related: ["free/radial-bar-chart", "free/progress-circle", "free/kpi"],
  tokens: ["color.chart-ramp-1", "color.foreground", "color.muted"],
  keywords: ["gauge", "meter", "target", "goal", "dial"],
  status: "new",
};
