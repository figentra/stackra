/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/timeline-chart` (Timeline chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Timeline chart entry of the component registry. */
export const FREE_TIMELINE_CHART: ComponentEntry = {
  slug: "timeline-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TimelineChart",
  parts: ["TimelineChart"],
  hero: {},
  examples: [{ id: "launch", card: true }],
  related: ["free/bar-chart"],
  tokens: ["color.chart-ramp-1", "color.chart-ramp-5", "color.surface"],
  keywords: ["gantt", "timeline", "schedule", "roadmap", "plan"],
  status: "new",
};
