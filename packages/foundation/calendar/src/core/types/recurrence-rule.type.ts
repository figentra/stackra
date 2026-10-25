/**
 * Stackra file contract:
 * Purpose: `RecurrenceRule`, an RFC 5545 RRULE after parsing: the frequency, interval, end and BY parts this package
 *          supports.
 * Boundary: internal; a type only. Weekdays are ISO (1 Monday to 7 Sunday); `nth` is the signed position of a weekday
 *           in its month (`2MO`, `-1FR`); `until` is the date part of UNTIL.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 6: RRULE recurrence).
 */
import type { IsoDate } from "#core/types/iso-date.type";

/** A parsed RRULE. */
export interface RecurrenceRule {
  /** FREQ. */
  readonly freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

  /** INTERVAL, 1 when absent. */
  readonly interval: number;

  /** COUNT, when given. */
  readonly count: number | undefined;

  /** The date of UNTIL, when given. */
  readonly until: IsoDate | undefined;

  /** BYDAY entries. */
  readonly byDay: readonly { readonly weekday: number; readonly nth: number | undefined }[];

  /** BYMONTHDAY, signed (`-1` is the last day). */
  readonly byMonthDay: readonly number[];

  /** BYMONTH, 1 to 12. */
  readonly byMonth: readonly number[];

  /** WKST as an ISO weekday, Monday when absent. */
  readonly weekStart: number;
}
