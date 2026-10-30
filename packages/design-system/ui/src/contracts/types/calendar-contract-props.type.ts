/**
 * Stackra file contract:
 * Purpose: `CalendarContractProps`, the props every runtime's `Calendar` takes: an always-visible month grid for one
 *          day, the inline twin of the DatePicker's popover and of RangeCalendar.
 * Boundary: types only; the value is a Gregorian `CalendarDate` whatever calendar the grid is shown in.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0318; STA-1371 (wave A, 2026-10-29).
 */
import type { CalendarDate } from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";

/** Props shared by the web and native `Calendar`. */
export interface CalendarContractProps {
  /** The chosen day, for a controlled calendar; `null` for none. */
  readonly value?: CalendarDate | null | undefined;
  /** The starting day, for an uncontrolled calendar. */
  readonly defaultValue?: CalendarDate | null | undefined;
  /** Called with each day picked. */
  readonly onChange?: ((value: CalendarDate) => void) | undefined;
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
