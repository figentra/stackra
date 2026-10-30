/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/form-section` (Form section).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Form section. */
export const FREE_FORM_SECTION: ComponentEntry = {
  slug: "form-section",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FormSection",
  parts: ["FormSection"],
  hero: {},
  examples: [{ id: "parts" }, { id: "states", card: true, platforms: ["react"] }, { id: "live" }],
  related: ["free/form-field", "free/form", "free/input-group"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["fieldset", "group", "section"],
};
