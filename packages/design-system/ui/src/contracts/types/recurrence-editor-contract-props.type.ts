/**
 * Stackra file contract:
 * Purpose: `RecurrenceEditorContractProps`, the props every runtime's `RecurrenceEditor` takes: the rule as RFC 5545
 *          `RRULE` text (controlled or not), the day it starts from, and the calendar its months count in.
 * Boundary: types only; the text is the caller's to store, next to its own `DTSTART`.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29).
 */
import type { CalendarDate } from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";

/** Props shared by the web and native `RecurrenceEditor`. */
export interface RecurrenceEditorContractProps {
  /** The rule, for example `FREQ=WEEKLY;BYDAY=SU,WE`, for a controlled editor; pair it with `onChange`. */
  readonly value?: string | undefined;
  /** The rule at the start, for an uncontrolled editor. Defaults to every week on the start day's weekday. */
  readonly defaultValue?: string | undefined;
  /** Called with the new `RRULE` text on every change. */
  readonly onChange?: ((value: string) => void) | undefined;
  /** The first day (the event's `DTSTART`): it picks the default weekday, day of month and month. Defaults to today. */
  readonly startDate?: CalendarDate | undefined;
  /**
   * The calendar months count in: `islamic-umalqura` makes "every month on the 1st" the Hijri 1st (RFC 7529 `RSCALE`)
   * and writes month names and the end date in Hijri. Defaults to `gregory`; a rule that names its own wins.
   */
  readonly calendar?: CalendarSystem | undefined;
  /** The group's name, for example "Repeat"; defaults to the catalogue's. */
  readonly label?: string | undefined;
  /** True to show the rule but refuse changes. */
  readonly isDisabled?: boolean | undefined;
}
