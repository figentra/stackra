/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/form-field` (Form field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Form field. */
export const FREE_FORM_FIELD: ComponentEntry = {
  slug: "form-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "FormField",
  parts: ["FormField"],
  hero: {},
  examples: [{ id: "live" }, { id: "states", card: true }],
  related: ["free/form", "free/form-section", "free/input-group"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["field", "label", "error"],
};
