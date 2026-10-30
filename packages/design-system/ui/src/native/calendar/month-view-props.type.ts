/**
 * Stackra file contract:
 * Purpose: `MonthViewProps`, the props of the native month grid that Calendar and RangeCalendar both draw (a `.type`
 *          file, not `.props`, so the API docs leave this internal part out).
 * Boundary: types only; internal.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { CalendarDate } from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";

/** Props of the native month grid. */
export interface MonthViewProps {
  /** Any day of the month shown. */
  readonly month: CalendarDate;
  /** Called with a day of the month to show next. */
  readonly onMonthChange: (month: CalendarDate) => void;
  /** Whether a day is drawn selected (tinted). */
  readonly isSelected: (date: CalendarDate) => boolean;
  /** Whether a day is refused. */
  readonly isOff: (date: CalendarDate) => boolean;
  /** Called with the day pressed. */
  readonly onPress: (date: CalendarDate) => void;
  /** The calendar the grid is shown in; defaults to `gregory`. */
  readonly calendar?: CalendarSystem | undefined;
  /** The spoken name of the calendar. */
  readonly label?: string | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
}
