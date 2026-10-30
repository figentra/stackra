/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/waffle-chart` (WaffleChart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The WaffleChart entry of the component registry. */
export const FREE_WAFFLE_CHART: ComponentEntry = {
  slug: "waffle-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "WaffleChart",
  parts: ["WaffleChart"],
  // HeroUI and Recharts have no waffle chart; this one is a grid of squares shared out by the largest remainder.
  hero: {},
  examples: [{ id: "payment-methods", card: true }, { id: "order-status" }],
  related: ["free/pie-chart", "free/donut-chart", "free/stacked-meter"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["waffle", "square pie", "grid", "percent", "part to whole", "share"],
  status: "new",
};
