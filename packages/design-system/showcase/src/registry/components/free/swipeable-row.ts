/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/swipeable-row` (Swipeable row).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Swipeable row entry of the component registry. */
export const FREE_SWIPEABLE_ROW: ComponentEntry = {
  slug: "swipeable-row",
  tier: "free",
  category: "data_display",
  platforms: ["native"],
  packageName: "@stackra/ui",
  exportName: "SwipeableRow",
  parts: ["SwipeableRow"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/list", "free/sortable-list"],
  tokens: ["color.danger", "color.accent"],
  haptics: [{ event: "open", style: "selection" }],
  keywords: ["swipe", "row actions", "archive", "delete"],
  status: "new",
};
