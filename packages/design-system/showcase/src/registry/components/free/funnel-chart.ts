/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/funnel-chart` (Funnel chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Funnel chart. */
export const FREE_FUNNEL_CHART: ComponentEntry = {
  slug: "funnel-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FunnelChart",
  parts: ["FunnelChart"],
  hero: {},
  examples: [{ id: "checkout", card: true }],
  related: ["free/bar-chart", "free/composed-chart"],
  tokens: ["color.chart-ramp-1", "color.muted"],
  keywords: ["funnel", "conversion", "checkout", "drop-off", "pipeline"],
  status: "new",
};
