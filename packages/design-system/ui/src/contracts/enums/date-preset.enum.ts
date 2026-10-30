/**
 * Stackra file contract:
 * Purpose: `DatePreset`, the one-day shortcuts a DatePicker can offer beside its calendar. `today` and `yesterday` are
 *          the range presets of the same names, so both pickers say and pick the same days.
 * Boundary: the values only; the words are `ui::date_presets.*`, the days `dateOfPreset`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */

/** The one-day presets. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); add a preset when a product needs it.
export const DatePreset = Object.freeze([
  "today",
  "yesterday",
  "tomorrow",
  "in_7_days",
  "start_of_month",
  "end_of_month",
] as const);

/** One one-day preset. */
export type DatePreset = (typeof DatePreset)[number];
