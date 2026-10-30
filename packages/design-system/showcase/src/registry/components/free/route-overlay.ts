/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/route-overlay` (Route overlay).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Route overlay entry of the component registry. */
export const FREE_ROUTE_OVERLAY: ComponentEntry = {
  slug: "route-overlay",
  tier: "free",
  category: "overlays",
  platforms: ["react"],
  packageName: "@stackra/navigation",
  exportName: "RouteOverlay",
  parts: ["RouteOverlay"],
  hero: {},
  examples: [
    { id: "presentations", card: true },
    { id: "dismissal" },
    { id: "live" },
    { id: "route" },
    { id: "stacked" },
  ],
  related: ["free/popover", "free/tooltip", "free/modal"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  keywords: ["route", "modal", "overlay"],
};
