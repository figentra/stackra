/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/chart-tooltip` (Chart tooltip).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ChartTooltip entry of the component registry. */
export const FREE_CHART_TOOLTIP: ComponentEntry = {
  slug: "chart-tooltip",
  tier: "free",
  category: "charts",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "ChartTooltip",
  parts: ["ChartTooltip"],
  hero: {},
  examples: [{ id: "dot", card: true }, { id: "line" }],
  related: ["free/area-chart", "free/line-chart", "free/chart-legend"],
  tokens: ["color.overlay", "shadow.overlay", "font.tabular"],
  keywords: ["tooltip", "chart", "recharts", "values"],
  status: "new",
};
