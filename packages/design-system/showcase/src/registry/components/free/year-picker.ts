/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/year-picker` (Year picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Year picker. */
export const FREE_YEAR_PICKER: ComponentEntry = {
  slug: "year-picker",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "YearPicker",
  parts: ["YearPicker"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "hijri" }],
  related: ["free/date-picker"],
  tokens: ["color.accent", "radius.field"],
  haptics: [{ event: "change", style: "selection" }],
  keywords: ["year", "grid", "hijri"],
  status: "new",
};
