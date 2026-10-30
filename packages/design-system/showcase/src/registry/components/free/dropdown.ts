/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/dropdown` (Dropdown).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Dropdown entry of the component registry. */
export const FREE_DROPDOWN: ComponentEntry = {
  slug: "dropdown",
  tier: "free",
  category: "overlays",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Dropdown",
  parts: ["Dropdown", "Dropdown.Trigger", "Dropdown.Menu", "Dropdown.Item"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "selection" }],
  related: ["free/menu", "free/action-menu", "free/popover"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  keywords: ["menu", "account menu", "locale switcher", "dropdown"],
  status: "new",
};
