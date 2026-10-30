/**
 * Stackra file contract:
 * Purpose: the web `DateRangePicker` on HeroUI v3's DateRangePicker: start and end date segments with a calendar
 *          button; its popover holds the preset ranges ("Last 7 days") beside a RangeCalendar. A preset sets the range
 *          and closes the popover.
 * Boundary: the presets are worked out from today by `dateRangeOfPreset` and named from the `ui` catalogue; their
 *           list is a `group` of buttons, each pressed state announced. The value stays Gregorian, also in the Hijri
 *           option. Focus, Escape and outside presses are React Aria's.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 2.1.1, 2.5.8, 4.1.2.
 */
import {
  DateField,
  DateRangePicker as HeroDateRangePicker,
  Description,
  FieldError,
  Label,
  RangeCalendar as HeroRangeCalendar,
  cn,
} from "@heroui/react";
import { getLocalTimeZone, today as todayIn, type CalendarDate } from "@internationalized/date";
import { useState, type ReactElement } from "react";

import { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { toGregorian } from "#core/functions/to-gregorian.function";
import { CalendarLocale } from "#react/date-picker/calendar-locale";
import { MONTH_BUTTON_CLASS } from "#react/date-picker/month-button-class.constant";
import { renderAsDiv } from "#react/date-picker/render-as-div.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ariaRangeOf } from "#react/range-calendar/aria-range-of.function";
import type { DateRangePickerProps } from "#react/date-range-picker/date-range-picker.props";

/** A labelled field over a range of days, with presets. */
export function DateRangePicker({
  label,
  description,
  errorMessage,
  variant = "primary",
  isFullWidth = true,
  presets = DateRangePreset,
  calendar,
  calendarButtonLabel,
  value,
  defaultValue,
  onChange,
  isOpen,
  defaultOpen,
  onOpenChange,
  isReadOnly,
  minValue,
  maxValue,
  today,
  className,
  name: _name,
  ...rest
}: DateRangePickerProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.date_range_picker;
  const buttonName = calendarButtonLabel ?? t(K.calendar);
  const [ownRange, setOwnRange] = useState<DateRangeValue | null>(defaultValue ?? null);
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const range = value === undefined ? ownRange : value;
  const open = !isReadOnly && (isOpen ?? ownOpen);
  const setOpen = (next: boolean) => {
    if (isOpen === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const change = (next: DateRangeValue | null) => {
    if (value === undefined) setOwnRange(next);
    if (next) onChange?.(next);
  };
  const from = today ?? todayIn(getLocalTimeZone());
  const bounds = omitUndefined({ minValue, maxValue });
  const picked = (preset: DateRangePreset) => {
    const ends = dateRangeOfPreset(preset, from);
    return Boolean(
      range?.start &&
      range.end &&
      range.start.compare(ends.start) === 0 &&
      range.end.compare(ends.end) === 0,
    );
  };
  return (
    <CalendarLocale calendar={calendar}>
      <HeroDateRangePicker
        {...omitUndefined(rest)}
        {...bounds}
        {...omitUndefined({ isReadOnly, value: ariaRangeOf(range) })}
        isOpen={open}
        onOpenChange={setOpen}
        onChange={(next) =>
          change(
            next && {
              start: toGregorian(next.start as CalendarDate),
              end: toGregorian(next.end as CalendarDate),
            },
          )
        }
        className={cn(isFullWidth && "w-full", className) ?? ""}
      >
        {label ? <Label>{label}</Label> : null}
        <DateField.Group fullWidth={isFullWidth} variant={variant}>
          <DateField.Input slot="start">
            {(segment) => <DateField.Segment segment={segment} className="min-h-6 min-w-6" />}
          </DateField.Input>
          <HeroDateRangePicker.RangeSeparator />
          <DateField.Input slot="end">
            {(segment) => <DateField.Segment segment={segment} className="min-h-6 min-w-6" />}
          </DateField.Input>
          <DateField.Suffix>
            <HeroDateRangePicker.Trigger aria-label={buttonName} className="size-6">
              <HeroDateRangePicker.TriggerIndicator />
            </HeroDateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        {description ? <Description>{description}</Description> : null}
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        <HeroDateRangePicker.Popover aria-label={buttonName}>
          <div className="flex flex-col gap-3 sm:flex-row">
            {presets.length > 0 ? (
              <div
                role="group"
                aria-label={t(K.presets)}
                className="flex flex-wrap gap-1 sm:flex-col sm:border-e sm:border-separator sm:pe-3"
              >
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={picked(preset)}
                    onClick={() => {
                      change(dateRangeOfPreset(preset, from));
                      setOpen(false);
                    }}
                    className={
                      cn(
                        "min-h-8 rounded-lg px-3 text-start text-sm outline-none hover:bg-default focus-visible:outline-2 focus-visible:outline-focus",
                        picked(preset) && "bg-accent-soft text-accent-soft-foreground",
                      ) ?? ""
                    }
                  >
                    {t(K[preset])}
                  </button>
                ))}
              </div>
            ) : null}
            <HeroRangeCalendar {...bounds}>
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
          </div>
        </HeroDateRangePicker.Popover>
      </HeroDateRangePicker>
    </CalendarLocale>
  );
}
