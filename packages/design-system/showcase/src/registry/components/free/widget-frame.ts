/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/widget-frame` (Widget frame).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Widget frame. */
export const FREE_WIDGET_FRAME: ComponentEntry = {
  slug: "widget-frame",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "WidgetFrame",
  parts: ["WidgetFrame"],
  hero: {},
  examples: [{ id: "states", card: true }],
  related: ["free/kpi", "free/card", "free/empty-state"],
  tokens: ["color.surface", "color.separator", "radius.lg"],
  keywords: ["widget", "dashboard tile", "panel", "card", "loading state"],
  status: "new",
};
