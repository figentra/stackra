/**
 * Stackra file contract:
 * Purpose: the web `Calendar`: the DatePicker's month grid (`DateCalendar`) shown inline, for one day, in the Gregorian
 *          or Hijri calendar.
 * Boundary: React Aria's calendar grid: arrow keys move by day (mirrored in right-to-left), Page Up/Down by month,
 *           Enter picks; the value handed out is always Gregorian (`toGregorian`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0318; ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.1; STA-1371.
 */
import type { CalendarDate } from "@internationalized/date";
import type { ReactElement } from "react";
import type { DateValue } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { toGregorian } from "#core/functions/to-gregorian.function";
import type { CalendarProps } from "#react/calendar/calendar.props";
import { CalendarLocale } from "#react/date-picker/calendar-locale";
import { DateCalendar } from "#react/date-picker/date-calendar";

/** A month grid for one day. */
export function Calendar({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  calendar,
  label,
  isDisabled,
  className,
}: CalendarProps): ReactElement {
  return (
    <CalendarLocale calendar={calendar}>
      <DateCalendar
        {...omitUndefined({
          value,
          defaultValue,
          minValue,
          maxValue,
          isDisabled,
          className,
          "aria-label": label,
          // A cast: the calendar holds only `CalendarDate`s, so it is only asked about them.
          isDateUnavailable: isDateUnavailable as ((date: DateValue) => boolean) | undefined,
        })}
        onChange={(date) => {
          const day = toGregorian(date as CalendarDate);
          if (day) onChange?.(day);
        }}
      />
    </CalendarLocale>
  );
}
