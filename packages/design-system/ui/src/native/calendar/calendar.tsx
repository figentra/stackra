/**
 * Stackra file contract:
 * Purpose: the native `Calendar`: an always-visible month grid for one day, the twin of RangeCalendar, in the
 *          Gregorian or Hijri calendar.
 * Boundary: the grid is the shared `MonthView`; each day is a button read by its full date and selected state, refused
 *           days are disabled. A selection haptic on each press.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0318; ADR 0192; WCAG 2.2 SC 4.1.2; STA-1371.
 */
import { getLocalTimeZone, isSameDay, today, type CalendarDate } from "@internationalized/date";
import { useState, type ReactElement } from "react";

import type { CalendarProps } from "#native/calendar/calendar.props";
import { MonthView } from "#native/calendar/month-view";
import { haptics } from "#native/haptics/haptics";

/** A month grid for one day. */
export function Calendar({
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
}: CalendarProps): ReactElement {
  const [own, setOwn] = useState<CalendarDate | null>(defaultValue ?? null);
  const day = value === undefined ? own : value;
  const [month, setMonth] = useState(() => day ?? today(getLocalTimeZone()));
  const isOff = (date: CalendarDate) =>
    Boolean(isDisabled) ||
    Boolean(minValue && date.compare(minValue) < 0) ||
    Boolean(maxValue && date.compare(maxValue) > 0) ||
    Boolean(isDateUnavailable?.(date));
  return (
    <MonthView
      month={month}
      onMonthChange={setMonth}
      isSelected={(date) => Boolean(day && isSameDay(date, day))}
      isOff={isOff}
      onPress={(date) => {
        haptics.play("selection");
        if (value === undefined) setOwn(date);
        onChange?.(date);
      }}
      calendar={calendar}
      label={label}
      className={className}
    />
  );
}
