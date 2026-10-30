/**
 * Stackra file contract:
 * Purpose: the web `RangeCalendar` on HeroUI v3's RangeCalendar: a month grid on which a first press starts a range
 *          and a second ends it, the days between highlighted. `calendar: "islamic-umalqura"` shows Hijri months.
 * Boundary: React Aria's grid: arrow keys move, Enter picks, the range is announced. The value stays Gregorian and
 *           `onChange` gets only complete ranges.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1,
 *          4.1.2.
 */
import { RangeCalendar as HeroRangeCalendar } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { ReactElement } from "react";
import type { DateValue } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { toGregorian } from "#core/functions/to-gregorian.function";
import { ariaRangeOf } from "#react/range-calendar/aria-range-of.function";
import { CalendarLocale } from "#react/date-picker/calendar-locale";
import { MONTH_BUTTON_CLASS } from "#react/date-picker/month-button-class.constant";
import { renderAsDiv } from "#react/date-picker/render-as-div.function";
import type { RangeCalendarProps } from "#react/range-calendar/range-calendar.props";

/** A month grid for a range of days. */
export function RangeCalendar({
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
}: RangeCalendarProps): ReactElement {
  return (
    <CalendarLocale calendar={calendar}>
      <HeroRangeCalendar
        {...omitUndefined({
          value: ariaRangeOf(value),
          defaultValue: ariaRangeOf(defaultValue),
          minValue,
          maxValue,
          isDisabled,
          className,
          "aria-label": label,
          // A cast: the calendar holds only `CalendarDate`s, so it is only asked about them.
          isDateUnavailable: isDateUnavailable as ((date: DateValue) => boolean) | undefined,
        })}
        onChange={(range) =>
          onChange?.({
            start: toGregorian(range.start as CalendarDate),
            end: toGregorian(range.end as CalendarDate),
          })
        }
      >
        <HeroRangeCalendar.Header render={renderAsDiv}>
          <HeroRangeCalendar.Heading />
          <HeroRangeCalendar.NavButton slot="previous" className={MONTH_BUTTON_CLASS} />
          <HeroRangeCalendar.NavButton slot="next" className={MONTH_BUTTON_CLASS} />
        </HeroRangeCalendar.Header>
        <HeroRangeCalendar.Grid weekdayStyle="narrow">
          <HeroRangeCalendar.GridHeader>
            {(day) => <HeroRangeCalendar.HeaderCell>{day}</HeroRangeCalendar.HeaderCell>}
          </HeroRangeCalendar.GridHeader>
          <HeroRangeCalendar.GridBody>
            {(date) => <HeroRangeCalendar.Cell date={date} />}
          </HeroRangeCalendar.GridBody>
        </HeroRangeCalendar.Grid>
      </HeroRangeCalendar>
    </CalendarLocale>
  );
}
