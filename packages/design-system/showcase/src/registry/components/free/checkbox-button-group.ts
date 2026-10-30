/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/checkbox-button-group` (Checkbox cards).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Checkbox cards. */
export const FREE_CHECKBOX_BUTTON_GROUP: ComponentEntry = {
  slug: "checkbox-button-group",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CheckboxButtonGroup",
  parts: ["CheckboxButtonGroup"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/radio-button-group", "free/checkbox-group"],
  tokens: ["color.accent-soft", "radius.surface"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["cards", "choices", "multiple", "checkbox"],
  status: "new",
};
