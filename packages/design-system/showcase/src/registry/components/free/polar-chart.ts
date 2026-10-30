/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/polar-chart` (PolarChart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Polar area chart. */
export const FREE_POLAR_CHART: ComponentEntry = {
  slug: "polar-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PolarChart",
  parts: ["PolarChart"],
  // HeroUI and Recharts have no polar area chart; this one draws its sectors with the shared arc geometry.
  hero: {},
  examples: [
    { id: "orders-by-weekday", card: true },
    { id: "store-and-online" },
    { id: "monthly-returns" },
  ],
  related: ["free/radar-chart", "free/pie-chart", "free/radial-bar-chart"],
  tokens: ["color.chart-1", "color.chart-2", "color.chart-3", "color.chart-4", "color.chart-5"],
  keywords: ["polar area", "nightingale", "rose", "coxcomb", "radial", "cyclic"],
  status: "new",
};
