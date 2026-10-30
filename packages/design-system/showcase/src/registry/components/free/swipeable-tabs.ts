/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/swipeable-tabs` (Swipeable tabs).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Swipeable tabs entry of the component registry. */
export const FREE_SWIPEABLE_TABS: ComponentEntry = {
  slug: "swipeable-tabs",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SwipeableTabs",
  parts: ["SwipeableTabs"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/tabs", "free/morph-tabs"],
  tokens: ["color.accent", "motion.duration"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["tabs", "swipe", "pager", "carousel"],
  status: "new",
};
