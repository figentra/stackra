/**
 * Stackra file contract:
 * Purpose: the web `WheelDatePicker`: a day on day, month and year wheels in the order the locale writes a date, in
 *          the locale's month names and the customer's digits. A day past the end of a new month moves to its last day.
 * Boundary: the wheels are WheelPicker's, the columns `wheelDateColumnsOf`'s; the value is a Gregorian `CalendarDate`.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0192.
 */
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { wheelDateColumnsOf } from "#core/functions/wheel-date-columns-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { WheelPicker } from "#react/wheel-picker/wheel-picker";
import type { WheelDatePickerProps } from "#react/wheel-picker/wheel-date-picker.props";

/** A day on three wheels. */
export function WheelDatePicker({
  value,
  defaultValue,
  onChange,
  minYear,
  maxYear,
  ...rest
}: WheelDatePickerProps): ReactElement {
  const { locale } = useLocale();
  const numerals = useNumerals();
  const t = useUiText();
  const K = FORMS_KEYS.ui.wheel;
  const [own, setOwn] = useState(() => defaultValue ?? today(getLocalTimeZone()));
  const day = value ?? own;
  const { columns, value: keys } = wheelDateColumnsOf({
    value: day,
    minYear: minYear ?? day.year - 100,
    maxYear: maxYear ?? day.year + 10,
    locale,
    numerals,
    labels: { day: t(K.day), month: t(K.month), year: t(K.year) },
  });
  return (
    <WheelPicker
      {...rest}
      columns={columns}
      value={keys}
      onChange={(next) => {
        const month = new CalendarDate(Number(next["year"]), Number(next["month"]), 1);
        const date = month.set({
          day: Math.min(Number(next["day"]), month.calendar.getDaysInMonth(month)),
        });
        if (value === undefined) setOwn(date);
        onChange?.(date);
      }}
    />
  );
}
