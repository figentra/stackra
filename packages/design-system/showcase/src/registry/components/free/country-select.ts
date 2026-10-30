/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/country-select` (Country select).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Country select entry of the component registry. */
export const FREE_COUNTRY_SELECT: ComponentEntry = {
  slug: "country-select",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "CountrySelect",
  parts: ["CountrySelect"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/combo-box", "free/phone-field"],
  tokens: ["radius.field"],
  keywords: ["country", "flag", "region"],
  status: "new",
};
