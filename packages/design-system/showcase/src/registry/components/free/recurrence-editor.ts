/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/recurrence-editor` (RecurrenceEditor).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The RecurrenceEditor entry of the component registry. */
export const FREE_RECURRENCE_EDITOR: ComponentEntry = {
  slug: "recurrence-editor",
  tier: "free",
  category: "date_and_time",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "RecurrenceEditor",
  parts: ["RecurrenceEditor"],
  hero: {},
  examples: [
    { id: "weekly", card: true },
    { id: "monthly" },
    { id: "hijri" },
    { id: "rtl", platforms: ["react"] },
  ],
  related: ["free/date-picker", "free/calendar", "free/toggle-button"],
  tokens: ["color.accent", "color.default", "radius.field"],
  keywords: ["recurrence", "repeat", "rrule", "schedule", "hijri", "calendar", "recurring"],
  status: "new",
};
