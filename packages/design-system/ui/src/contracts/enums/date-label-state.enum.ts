/**
 * Stackra file contract:
 * Purpose: `DateLabelState`, the state a `DateLabel` shows: none, a due date that is near or past, or an expiry that
 *          is near or past. Each state other than `none` has a word in `ui::date_label.<state>` and a tone.
 * Boundary: the values only; `dateLabelOf` in core derives one.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */

/** The date label states. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the words live in the catalogue.
export const DateLabelState = Object.freeze([
  "none",
  "due_soon",
  "overdue",
  "expiring_soon",
  "expired",
] as const);

/** One date label state. */
export type DateLabelState = (typeof DateLabelState)[number];
