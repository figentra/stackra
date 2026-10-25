/**
 * Stackra file contract:
 * Purpose: `BusinessDayResult`, the answer of `addBusinessDays`: the date reached and every uncertain day the count
 *          crossed or landed on, so a deadline warns instead of guessing.
 * Boundary: a type only. An empty `uncertain` list means the result is certain under the calendar's data.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 4).
 */
import type { IsoDate } from "#core/types/iso-date.type";

/** The date reached and the doubts on the way. */
export interface BusinessDayResult {
  /** The date reached. */
  readonly date: IsoDate;

  /** The uncertain days counted or skipped on the way, oldest first. */
  readonly uncertain: readonly IsoDate[];
}
