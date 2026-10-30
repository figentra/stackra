/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/radio-button-group` (Radio cards).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Radio cards. */
export const FREE_RADIO_BUTTON_GROUP: ComponentEntry = {
  slug: "radio-button-group",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RadioButtonGroup",
  parts: ["RadioButtonGroup"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "horizontal" }],
  related: ["free/checkbox-button-group", "free/radio-group"],
  tokens: ["color.accent-soft", "radius.surface"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["cards", "choices", "plan", "radio"],
  status: "new",
};
