/**
 * Stackra file contract:
 * Purpose: the props every runtime's `RangeCalendar` takes: a month grid on which the user picks a first and a last day.
 * Boundary: types only. The value is a `DateRangeValue` with both ends set once a range is complete.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { CalendarDate } from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";

/** Props shared by the web and native `RangeCalendar`. */
export interface RangeCalendarContractProps {
  /** The range, for a controlled calendar. */
  readonly value?: DateRangeValue | null | undefined;
  /** The starting range, for an uncontrolled calendar. */
  readonly defaultValue?: DateRangeValue | null | undefined;
  /** Called with each complete range: both ends set, the start never after the end. */
  readonly onChange?: ((value: DateRangeValue) => void) | undefined;
  /** The earliest day that can be picked. */
  readonly minValue?: CalendarDate | undefined;
  /** The latest day that can be picked. */
  readonly maxValue?: CalendarDate | undefined;
  /** Whether a day is refused, for example a closed day. */
  readonly isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  /** The calendar the grid is shown in; defaults to `gregory`. The value stays Gregorian. */
  readonly calendar?: CalendarSystem | undefined;
  /** The spoken name of the calendar. */
  readonly label?: string | undefined;
  /** True to refuse every change. */
  readonly isDisabled?: boolean | undefined;
}
