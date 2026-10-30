/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/bullet-chart` (Bullet chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts: the full set).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Bullet chart. */
export const FREE_BULLET_CHART: ComponentEntry = {
  slug: "bullet-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "BulletChart",
  parts: ["BulletChart"],
  hero: {},
  examples: [{ id: "targets", card: true }],
  related: ["free/funnel-chart", "free/stacked-meter", "free/range-bar-chart"],
  tokens: ["color.chart-ramp-1", "color.muted", "color.surface"],
  keywords: ["bullet", "target", "goal", "progress", "kpi"],
  status: "new",
};
