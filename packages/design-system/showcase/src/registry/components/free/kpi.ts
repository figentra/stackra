/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/kpi` (KPI).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** KPI. */
export const FREE_KPI: ComponentEntry = {
  slug: "kpi",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Kpi",
  parts: ["Kpi", "TrendChip"],
  hero: {},
  examples: [{ id: "band", card: true }, { id: "tiles" }],
  related: ["free/widget-frame", "free/sparkline", "free/progress-bar"],
  tokens: ["color.success", "color.danger", "color.accent-soft"],
  keywords: ["kpi", "metric", "stat", "trend", "delta", "target", "scorecard"],
  status: "new",
};
