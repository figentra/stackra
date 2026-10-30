/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/address-field` (Address field).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Address field. */
export const FREE_ADDRESS_FIELD: ComponentEntry = {
  slug: "address-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AddressField",
  parts: ["AddressField"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/country-select", "free/form-section"],
  tokens: ["radius.field"],
  keywords: ["address", "shipping", "delivery", "postal"],
  status: "new",
};
