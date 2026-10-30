/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/text-area-field` (Text area field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Text area field. */
export const FREE_TEXT_AREA_FIELD: ComponentEntry = {
  slug: "text-area-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "TextAreaField",
  parts: ["TextAreaField"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "live" }],
  related: ["free/text-area", "free/form-field", "free/form"],
  tokens: ["color.field", "radius.field", "color.focus"],
  keywords: ["multiline", "note", "form binding", "textarea"],
  status: "new",
};
