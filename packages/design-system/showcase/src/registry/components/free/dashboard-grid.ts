/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/dashboard-grid` (Dashboard grid).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (component wave B: data and dashboards).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The DashboardGrid entry of the component registry. */
export const FREE_DASHBOARD_GRID: ComponentEntry = {
  slug: "dashboard-grid",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DashboardGrid",
  parts: ["DashboardGrid"],
  hero: {},
  examples: [{ id: "editable", card: true }],
  related: ["free/widget-frame", "free/kpi", "free/sortable-list"],
  tokens: ["color.accent", "color.separator", "radius.lg"],
  keywords: ["dashboard", "grid", "layout", "drag and drop", "resize", "widgets"],
  status: "new",
};
