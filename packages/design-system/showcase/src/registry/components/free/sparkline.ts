/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/sparkline` (Sparkline).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (Stackra's own charts).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Sparkline. */
export const FREE_SPARKLINE: ComponentEntry = {
  slug: "sparkline",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Sparkline",
  parts: ["Sparkline"],
  hero: {},
  examples: [
    { id: "kinds", card: true },
    { id: "stat" },
  ],
  related: ["free/line-chart", "free/area-chart", "free/bar-chart"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["sparkline", "trend", "micro chart", "inline"],
};
