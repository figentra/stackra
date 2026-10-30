/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/checkbox-field` (Checkbox field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The CheckboxField entry of the component registry. */
export const FREE_CHECKBOX_FIELD: ComponentEntry = {
  slug: "checkbox-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "CheckboxField",
  parts: ["CheckboxField"],
  hero: {},
  examples: [{ id: "consent", card: true }, { id: "states" }],
  related: ["free/checkbox", "free/form-field", "free/form"],
  tokens: ["color.accent", "radius.control", "color.focus"],
  keywords: ["consent", "terms", "agree", "form binding", "checkbox"],
  status: "new",
};
