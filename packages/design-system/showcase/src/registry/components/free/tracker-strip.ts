/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/tracker-strip` (Tracker strip).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave B: data and dashboards).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The TrackerStrip entry of the component registry. */
export const FREE_TRACKER_STRIP: ComponentEntry = {
  slug: "tracker-strip",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "TrackerStrip",
  parts: ["TrackerStrip"],
  hero: {},
  examples: [{ id: "uptime", card: true }, { id: "services" }],
  related: ["free/calendar-heatmap", "free/status-indicator", "free/kpi"],
  tokens: ["color.success", "color.warning", "color.danger", "color.default"],
  keywords: ["tracker", "uptime", "status", "availability", "incident", "sla"],
  status: "new",
};
