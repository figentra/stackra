/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/action-menu` (Action menu).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Action menu entry of the component registry. */
export const FREE_ACTION_MENU: ComponentEntry = {
  slug: "action-menu",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ActionMenu",
  parts: ["ActionMenu"],
  hero: {},
  examples: [
    { id: "basics", card: true },
    { id: "variants", platforms: ["react"] },
    { id: "icon", platforms: ["react"] },
    { id: "placement" },
    { id: "states", platforms: ["react"] },
    { id: "live" },
    { id: "refused", platforms: ["native"] },
    { id: "look", platforms: ["native"] },
  ],
  related: ["free/alert-dialog", "free/drawer", "free/leave-confirmation"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["dropdown", "more", "actions", "kebab"],
};
