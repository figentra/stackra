/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/calendar-heatmap` (Calendar heatmap).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts wave 2).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Calendar heatmap entry of the component registry. */
export const FREE_CALENDAR_HEATMAP: ComponentEntry = {
  slug: "calendar-heatmap",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CalendarHeatmap",
  parts: ["CalendarHeatmap"],
  hero: {},
  examples: [{ id: "activity", card: true }],
  related: ["free/heatmap-chart", "free/line-chart", "free/kpi"],
  tokens: ["color.chart-ramp-1", "color.surface"],
  keywords: ["calendar", "activity", "contributions", "daily", "streak"],
  status: "new",
};
