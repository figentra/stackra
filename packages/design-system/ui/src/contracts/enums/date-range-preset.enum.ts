/**
 * Stackra file contract:
 * Purpose: `DateRangePreset`, the ready-made ranges a DateRangePicker offers beside its calendar.
 * Boundary: the values only; `dateRangeOfPreset` works each one out from today.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */

/** The preset ranges. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); add a preset when a product needs it.
export const DateRangePreset = Object.freeze([
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "this_year",
] as const);

/** One preset range. */
export type DateRangePreset = (typeof DateRangePreset)[number];
