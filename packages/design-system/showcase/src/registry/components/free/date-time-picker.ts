/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/date-time-picker` (Date and time picker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Date and time picker. */
export const FREE_DATE_TIME_PICKER: ComponentEntry = {
  slug: "date-time-picker",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "DateTimePicker",
  parts: ["DateTimePicker"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/date-picker", "free/time-field"],
  tokens: ["radius.field", "color.overlay"],
  keywords: ["date", "time", "appointment", "schedule"],
  status: "new",
};
