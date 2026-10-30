/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/navigation-list` (Navigation list).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Navigation list. */
export const FREE_NAVIGATION_LIST: ComponentEntry = {
  slug: "navigation-list",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NavigationList",
  parts: ["NavigationList"],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "current" },
    { id: "groups" },
    { id: "badges", platforms: ["react"] },
    { id: "states", platforms: ["react"] },
    { id: "shortcuts", platforms: ["react"] },
    { id: "compact", platforms: ["react"] },
    { id: "arabic", platforms: ["react"] },
    { id: "live" },
    { id: "refused", platforms: ["native"] },
  ],
  related: ["free/navigation-header", "free/sidebar", "free/link"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["nav", "menu", "links"],
};
