/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/stacked-meter` (Stacked meter).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Stacked meter. */
export const FREE_STACKED_METER: ComponentEntry = {
  slug: "stacked-meter",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "StackedMeter",
  parts: ["StackedMeter"],
  hero: {},
  examples: [{ id: "storage", card: true }],
  related: ["free/progress-bar", "free/treemap-chart", "free/kpi"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-3", "color.default"],
  keywords: ["meter", "usage", "quota", "storage", "stacked bar", "capacity"],
  status: "new",
};
