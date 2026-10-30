/**
 * Stackra file contract:
 * Purpose: `RecurrenceAnchor`, what a rule's first day says about the defaults: its weekday, its day of the month,
 *          which of that weekday it is in the month, and its month, the last three in the rule's calendar.
 * Boundary: types only; `recurrenceAnchorOf` fills it.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; STA-1371.
 */
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";

/** The defaults the first day gives. */
export interface RecurrenceAnchor {
  /** The weekday of the first day. */
  readonly weekday: RecurrenceWeekday;
  /** Its day of the month. */
  readonly monthDay: number;
  /** Which of its weekday it is in the month: 1 to 4, or -1 when it is the last (the 5th, or a 4th with no 5th). */
  readonly nth: number;
  /** Its month, 1 to 12. */
  readonly month: number;
}
