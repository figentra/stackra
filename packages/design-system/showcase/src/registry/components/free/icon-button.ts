/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/icon-button` (Icon button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Icon button entry of the component registry. */
export const FREE_ICON_BUTTON: ComponentEntry = {
  slug: "icon-button",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "IconButton",
  parts: ["IconButton"],
  hero: {},
  examples: [{ id: "variants", card: true }, { id: "states" }, { id: "live" }],
  related: ["free/close-button", "free/button"],
  tokens: ["color.accent", "radius.field", "motion.press"],
  haptics: [{ event: "press", style: "impact" }],
  keywords: ["icon", "button", "action"],
};
