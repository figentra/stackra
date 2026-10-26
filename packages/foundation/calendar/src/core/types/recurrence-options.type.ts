/**
 * Stackra file contract:
 * Purpose: `RecurrenceOptions`, what `occurrences` needs: the RRULE text, the first date and its local time, the time
 *          zone the series lives in, the window to return, dates to leave out, and the calendar whose holidays are
 *          skipped.
 * Boundary: a type only. `to` is required, so an endless rule is always read through a finite window. `countMode`
 *           is `generated` (RFC 5545) when absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 6) as amended by ADR 0387.
 */
import type { CountMode } from "#core/enums/count-mode.enum";
import type { BusinessCalendar } from "#core/types/business-calendar.type";
import type { IsoDate } from "#core/types/iso-date.type";

/** The input of `occurrences`. */
export interface RecurrenceOptions {
  /** RFC 5545 RRULE text (`FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10`), with or without the `RRULE:` prefix. */
  readonly rule: string;

  /** The first date of the series (DTSTART's date). */
  readonly start: IsoDate;

  /** The local start time of every occurrence, `HH:mm`. */
  readonly time: string;

  /** The IANA time zone the series is kept in, so 09:00 stays 09:00 across clock changes. */
  readonly timeZone: string;

  /** The first date to return; earlier occurrences still count toward COUNT. The series start when absent. */
  readonly from?: IsoDate;

  /** The last date to return. */
  readonly to: IsoDate;

  /** Dates left out (EXDATE); they count toward COUNT unless `countMode` is `kept`. */
  readonly except?: readonly IsoDate[];

  /** When given, occurrences on its holidays are left out and those on uncertain days are flagged. */
  readonly calendar?: BusinessCalendar;

  /** What COUNT counts: every generated date (the default) or only kept dates. */
  readonly countMode?: CountMode;
}
