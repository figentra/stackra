/**
 * Stackra file contract:
 * Purpose: `RecurrenceRule`, an RFC 5545 RRULE after parsing: the frequency, interval, end and BY parts this package
 *          supports.
 * Boundary: internal; a type only. Weekdays are ISO (1 Monday to 7 Sunday); `nth` is the signed position of a weekday
 *           in its month, or in its year for a YEARLY rule without BYMONTH (`2MO`, `-1FR`, `20MO`); `until` is the
 *           date part of UNTIL and `untilTime` its time, when UNTIL carries one (seconds after midnight, `utc` when it
 *           ends in `Z`, otherwise a wall time in the series' zone). Hours, minutes and seconds may be zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 6) as amended by ADR 0387.
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

  /** The time of UNTIL, when it carries one. */
  readonly untilTime: { readonly second: number; readonly utc: boolean } | undefined;

  /** BYDAY entries. */
  readonly byDay: readonly { readonly weekday: number; readonly nth: number | undefined }[];

  /** BYMONTHDAY, signed (`-1` is the last day). */
  readonly byMonthDay: readonly number[];

  /** BYMONTH, 1 to 12. */
  readonly byMonth: readonly number[];

  /** BYYEARDAY, signed (`-1` is the last day of the year). */
  readonly byYearDay: readonly number[];

  /** BYWEEKNO, signed; weeks start on WKST and week 1 holds at least four days of the year. */
  readonly byWeekNo: readonly number[];

  /** BYHOUR, 0 to 23. */
  readonly byHour: readonly number[];

  /** BYMINUTE, 0 to 59. */
  readonly byMinute: readonly number[];

  /** BYSECOND, 0 to 59. */
  readonly bySecond: readonly number[];

  /** BYSETPOS, signed positions in each period's set of instances. */
  readonly bySetPos: readonly number[];

  /** WKST as an ISO weekday, Monday when absent. */
  readonly weekStart: number;
}
