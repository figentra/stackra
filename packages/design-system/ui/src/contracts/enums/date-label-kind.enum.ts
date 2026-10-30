/**
 * Stackra file contract:
 * Purpose: `DateLabelKind`, what a `DateLabel`'s date means: a plain date (created, paid), a due date (an invoice,
 *          a purchase order) or an expiry (a batch, a licence, a promotion). The kind decides which states it can show.
 * Boundary: the values only; `dateLabelOf` in core turns a kind and a date into a state.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */

/** The date label kinds. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the kinds carry no labels.
export const DateLabelKind = Object.freeze(["date", "due", "expiry"] as const);

/** One date label kind. */
export type DateLabelKind = (typeof DateLabelKind)[number];
