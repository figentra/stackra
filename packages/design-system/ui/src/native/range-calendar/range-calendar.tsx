/**
 * Stackra file contract:
 * Purpose: the native `RangeCalendar`: a month grid with previous and next month buttons; the first press starts a
 *          range, the second ends it (in order), the days between tinted. In the Hijri option the heading adds the
 *          Hijri months and each day its Hijri day under it.
 * Boundary: the grid is the shared `MonthView`, the presses `nextRangeOf`. Each day is a button read by its full date
 *           and selected state; refused days are disabled. A selection haptic on each press.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0192; WCAG 2.2
 *          SC 4.1.2.
 */
import { getLocalTimeZone, isSameDay, today, type CalendarDate } from "@internationalized/date";
import { useState, type ReactElement } from "react";

import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import { nextRangeOf } from "#core/functions/next-range-of.function";
import { MonthView } from "#native/calendar/month-view";
import { haptics } from "#native/haptics/haptics";
import type { RangeCalendarProps } from "#native/range-calendar/range-calendar.props";

/** A month grid for a range of days. */
export function RangeCalendar({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  calendar = "gregory",
  label,
  isDisabled,
  className,
}: RangeCalendarProps): ReactElement {
  const [own, setOwn] = useState<DateRangeValue | null>(defaultValue ?? null);
  const range = value === undefined ? own : value;
  const [anchor, setAnchor] = useState<CalendarDate | null>(null);
  const [month, setMonth] = useState(() => range?.start ?? today(getLocalTimeZone()));

  const isOff = (date: CalendarDate) =>
    Boolean(isDisabled) ||
    Boolean(minValue && date.compare(minValue) < 0) ||
    Boolean(maxValue && date.compare(maxValue) > 0) ||
    Boolean(isDateUnavailable?.(date));
  const inRange = (date: CalendarDate) =>
    anchor
      ? isSameDay(date, anchor)
      : Boolean(
          range?.start &&
          range.end &&
          date.compare(range.start) >= 0 &&
          date.compare(range.end) <= 0,
        );
  const press = (date: CalendarDate) => {
    haptics.play("selection");
    const next = nextRangeOf(anchor, date);
    setAnchor(next.anchor);
    if (next.range) {
      if (value === undefined) setOwn(next.range);
      onChange?.(next.range);
    }
  };

  return (
    <MonthView
      month={month}
      onMonthChange={setMonth}
      isSelected={inRange}
      isOff={isOff}
      onPress={press}
      calendar={calendar}
      label={label}
      className={className}
    />
  );
}
