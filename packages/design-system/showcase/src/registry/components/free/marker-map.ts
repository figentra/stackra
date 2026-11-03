/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/marker-map` (Marker map).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1981.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Marker map entry of the component registry. */
export const FREE_MARKER_MAP: ComponentEntry = {
  slug: "marker-map",
  tier: "free",
  category: "data_display",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "MarkerMap",
  parts: ["MarkerMap"],
  hero: {},
  examples: [{ id: "basics", card: true, minHeight: 420 }],
  related: ["free/choropleth-map", "free/side-panel", "free/list"],
  tokens: ["color.chart-1", "color.foreground", "color.surface"],
  keywords: ["map", "marker", "pin", "location", "places"],
  status: "new",
  advanced: true,
};
