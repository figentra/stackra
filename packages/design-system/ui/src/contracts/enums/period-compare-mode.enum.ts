/**
 * Stackra file contract:
 * Purpose: `PeriodCompareMode`, what a `PeriodPicker` compares its period with: the `previous` period of the same
 *          length just before it, or the same period a `year` earlier.
 * Boundary: a frozen tuple and its type; the words live in the `ui` catalogue (`period_picker.previous`, `.year`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** The periods a `PeriodPicker` can compare with. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const PeriodCompareMode = Object.freeze(["previous", "year"] as const);

/** One comparison mode. */
export type PeriodCompareMode = (typeof PeriodCompareMode)[number];
