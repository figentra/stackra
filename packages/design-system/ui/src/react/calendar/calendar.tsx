/**
 * Stackra file contract:
 * Purpose: the web `Calendar`: the DatePicker's month grid (`DateCalendar`) shown inline, for one day, in the Gregorian
 *          or Hijri calendar.
 * Boundary: React Aria's calendar grid: arrow keys move by day (mirrored in right-to-left), Page Up/Down by month,
 *           Enter picks; the value handed out is always Gregorian (`toGregorian`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0318; ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.1; STA-1371.
 */
import { type CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { STANDARD_SHORTCUTS } from "@stackra/shortcuts";
import { useShortcutActions } from "@stackra/shortcuts/react";
import { type ReactElement, useRef, useState } from "react";
import type { DateValue } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { toGregorian } from "#core/functions/to-gregorian.function";
import type { CalendarProps } from "#react/calendar/calendar.props";
import { CalendarLocale } from "#react/date-picker/calendar-locale";
import { DateCalendar } from "#react/date-picker/date-calendar";
import { useUiText } from "#react/hooks/use-ui-text";

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
  const t = useUiText();
  const S = UI_KEYS.ui.shortcuts;
  const box = useRef<HTMLDivElement>(null);
  // The focused date is held here so the shortcuts can move it; it starts where React Aria would start it.
  const [focused, setFocused] = useState<DateValue>(
    () => value ?? defaultValue ?? today(getLocalTimeZone()),
  );
  const move = (months: number) => setFocused(focused.add({ months }));
  // While focus is in the calendar (ADR 0508): T goes to today, Mod+Left and Right change the month, mirrored in RTL.
  useShortcutActions(
    isDisabled
      ? []
      : [
          {
            id: "calendar.today",
            label: t(S.today),
            shortcut: STANDARD_SHORTCUTS["calendar.today"],
            run: () => setFocused(today(getLocalTimeZone())),
          },
          {
            id: "calendar.previous",
            label: t(S.previous),
            shortcut: STANDARD_SHORTCUTS["calendar.previous"],
            isDirectional: true,
            run: () => move(-1),
          },
          {
            id: "calendar.next",
            label: t(S.next),
            shortcut: STANDARD_SHORTCUTS["calendar.next"],
            isDirectional: true,
            run: () => move(1),
          },
        ],
    { within: box },
  );
  return (
    <CalendarLocale calendar={calendar}>
      <div ref={box} className="contents">
        <DateCalendar
          focusedValue={focused}
          onFocusChange={setFocused}
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
      </div>
    </CalendarLocale>
  );
}
