/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/number-ticker` (NumberTicker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** NumberTicker. */
export const FREE_NUMBER_TICKER: ComponentEntry = {
  slug: "number-ticker",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NumberTicker",
  parts: ["NumberTicker"],
  hero: {},
  examples: [{ id: "counter", card: true }, { id: "currency" }],
  related: ["free/sparkline"],
  tokens: [],
  keywords: ["count up", "number animation", "counter", "odometer"],
  status: "new",
};
