/**
 * Stackra file contract:
 * Purpose: the web `DateTimePicker` on HeroUI v3's DatePicker at minute granularity: day, month, year, hour and minute
 *          segments with a calendar button; the calendar picks the day and the segments keep the time.
 * Boundary: the value is a `CalendarDateTime` (no zone). `calendar: "islamic-umalqura"` shows the Hijri calendar; the
 *           value stays Gregorian. The look and the a11y are the DatePicker's.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 2.1.1, 2.5.8, 4.1.2.
 */
import {
  DateField,
  DatePicker as HeroDatePicker,
  Description,
  FieldError,
  Label,
  cn,
} from "@heroui/react";
import type { CalendarDateTime } from "@internationalized/date";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { toGregorian } from "#core/functions/to-gregorian.function";
import { CalendarLocale } from "#react/date-picker/calendar-locale";
import { DateCalendar } from "#react/date-picker/date-calendar";
import { useUiText } from "#react/hooks/use-ui-text";
import type { DateTimePickerProps } from "#react/date-time-picker/date-time-picker.props";

/** A labelled field for a day and a time of day. */
export function DateTimePicker({
  label,
  description,
  errorMessage,
  variant = "primary",
  isFullWidth = true,
  calendarButtonLabel,
  calendar,
  minValue,
  maxValue,
  onChange,
  isReadOnly,
  className,
  ...rest
}: DateTimePickerProps): ReactElement {
  const t = useUiText();
  const name = calendarButtonLabel ?? t(UI_KEYS.ui.date_picker.calendar);
  const bounds = omitUndefined({ minValue, maxValue });
  return (
    <CalendarLocale calendar={calendar}>
      <HeroDatePicker
        {...omitUndefined(rest)}
        {...bounds}
        {...omitUndefined({ isReadOnly })}
        {...(isReadOnly ? { isOpen: false } : {})}
        granularity="minute"
        onChange={(value: CalendarDateTime | null) => onChange?.(toGregorian(value))}
        className={
          cn(isFullWidth && "w-full", typeof className === "string" ? className : undefined) ?? ""
        }
      >
        {label ? <Label>{label}</Label> : null}
        <DateField.Group fullWidth={isFullWidth} variant={variant}>
          <DateField.Input>
            {(segment) => <DateField.Segment segment={segment} className="min-h-6 min-w-6" />}
          </DateField.Input>
          <DateField.Suffix>
            <HeroDatePicker.Trigger aria-label={name} className="size-6">
              <HeroDatePicker.TriggerIndicator />
            </HeroDatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        {description ? <Description>{description}</Description> : null}
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        <HeroDatePicker.Popover aria-label={name}>
          <DateCalendar {...bounds} />
        </HeroDatePicker.Popover>
      </HeroDatePicker>
    </CalendarLocale>
  );
}
