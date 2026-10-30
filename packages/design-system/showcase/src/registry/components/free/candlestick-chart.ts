/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/candlestick-chart` (Candlestick chart).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (charts wave 2).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Candlestick chart entry of the component registry. */
export const FREE_CANDLESTICK_CHART: ComponentEntry = {
  slug: "candlestick-chart",
  tier: "free",
  category: "charts",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CandlestickChart",
  parts: ["CandlestickChart"],
  hero: {},
  examples: [{ id: "prices", card: true }],
  related: ["free/line-chart", "free/composed-chart", "free/sparkline"],
  tokens: ["color.success", "color.danger", "color.muted"],
  keywords: ["candlestick", "ohlc", "stock", "price", "volume"],
  status: "new",
};
