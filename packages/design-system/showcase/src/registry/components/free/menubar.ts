/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/menubar` (Menubar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Menubar entry of the component registry. */
export const FREE_MENUBAR: ComponentEntry = {
  slug: "menubar",
  tier: "free",
  category: "navigation",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Menubar",
  parts: ["Menubar"],
  // HeroUI has no menubar; this one is a row of HeroUI Dropdowns on the WAI-ARIA menubar pattern.
  hero: {},
  examples: [
    { id: "basics", card: true, minHeight: 380 },
    { id: "checkable", minHeight: 380 },
  ],
  related: ["free/menu", "free/action-menu", "free/app-header"],
  tokens: ["color.overlay", "shadow.overlay", "color.focus"],
  keywords: ["menubar", "application menu", "file menu", "edit menu", "desktop menu"],
  status: "new",
};
