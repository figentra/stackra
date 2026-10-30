/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/navigation-menu` (Navigation menu).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`. Web
 *           only: a phone app navigates by its tab bar and lists.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave C).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The NavigationMenu entry of the component registry. */
export const FREE_NAVIGATION_MENU: ComponentEntry = {
  slug: "navigation-menu",
  tier: "free",
  category: "navigation",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "NavigationMenu",
  parts: ["NavigationMenu"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "mega" }],
  related: ["free/navigation-list", "free/app-header", "free/menu"],
  tokens: ["color.overlay", "shadow.overlay", "radius.lg"],
  keywords: ["navigation menu", "mega menu", "top bar", "site navigation", "header links"],
  status: "new",
};
