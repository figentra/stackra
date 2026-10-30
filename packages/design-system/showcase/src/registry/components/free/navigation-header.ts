/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/navigation-header` (Navigation header).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Navigation header entry of the component registry. */
export const FREE_NAVIGATION_HEADER: ComponentEntry = {
  slug: "navigation-header",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "NavigationHeader",
  parts: ["NavigationHeader"],
  hero: {},
  examples: [{ id: "parts" }, { id: "arabic" }, { id: "live", card: true }],
  related: ["free/link", "free/navigation-list", "free/cursor-pagination"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  keywords: ["header", "back", "title"],
};
