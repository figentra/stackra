/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/phone-field` (Phone field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Phone field entry of the component registry. */
export const FREE_PHONE_FIELD: ComponentEntry = {
  slug: "phone-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PhoneField",
  parts: ["PhoneField"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/country-select", "free/text-field"],
  tokens: ["radius.field", "color.field"],
  keywords: ["phone", "mobile", "dial code", "country"],
  status: "new",
};
