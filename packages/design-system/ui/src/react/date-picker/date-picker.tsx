/**
 * Stackra file contract:
 * Purpose: the web `DatePicker` on HeroUI v3's DatePicker: a date field (the label, the editable day, month and year
 *          segments, the description and the error message) with a button that opens a calendar in a popover. It maps the
 *          shared contract (`isFullWidth` to the width of the picker and its group, `variant` to the group's look, one
 *          default each for `primary` and full width, `isOpen`, `defaultOpen` and `onOpenChange` to the calendar's open
 *          state, `calendarButtonLabel` to the name of the button) and passes every other React Aria date picker prop
 *          (`minValue`, `maxValue`, `isDateUnavailable`, `shouldCloseOnSelect`, `validationBehavior`, `className`,
 *          `aria-label`) through to HeroUI's root. The value is a `CalendarDate` of `@internationalized/date`, or `null`
 *          for an empty field.
 * Boundary: no styling of its own beyond the minimum size of a segment and of the button and the flip of the month
 *           chevrons in a right-to-left page; the look is HeroUI's, themed by `@stackra/tokens`. The calendar refuses a day
 *           before `minValue`, after `maxValue` or for which `isDateUnavailable` is true (the bounds are given to the
 *           calendar as well as the picker, since HeroUI's calendar would otherwise keep its own), and the typed field makes
 *           such a day invalid. The calendar's header is a `div`, not a banner landmark. It is a dialog named by
 *           `calendarButtonLabel`; React Aria hides the page behind it from assistive technology, closes it on Escape or a
 *           press outside and returns focus to the button. A disabled picker is left out of the submit; a read-only one
 *           keeps focus on its segments and is submitted, but never opens and its segments refuse change. The year is changed with the
 *           month buttons or by typing it into the field, since HeroUI's year grid names itself in English only. A picker
 *           without a visible `label` is named by the caller with `aria-label`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (open state); ADR 0318 (decision 7); ADR 0165
 *          (UI contract, HeroUI v3 on web); ADR 0055 (forms: one field contract); WCAG 2.2 SC 2.1.1, 2.5.8, 4.1.2; owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import {
  Calendar,
  DateField,
  DatePicker as HeroDatePicker,
  Description,
  FieldError,
  Label,
  type CalendarHeaderProps,
} from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { ComponentProps } from "react";
import { composeRenderProps, type DateValue } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { DatePickerProps } from "#react/date-picker/date-picker.props";

/**
 * A segment and the calendar button are at least 24 CSS pixels each way: HeroUI's segment is about 20 pixels high and,
 * with a day or month in two digits, narrower than that, and its button is 24 pixels only by its padding. They sit side
 * by side, which is under the minimum target of WCAG 2.2 SC 2.5.8.
 */
const SEGMENT_CLASS = "min-h-6 min-w-6";
const BUTTON_CLASS = "size-6";

/**
 * The chevrons of the two month buttons point the other way in a right-to-left page, where the previous month is to the
 * right. HeroUI flips them, but its date picker then resets the flip inside its popover, so the flip is made again here
 * (`!` because the reset is the more specific rule).
 */
const MONTH_BUTTON_CLASS = "rtl:[&_svg]:rotate-180!";

/**
 * React Aria types the callback for every kind of date, but a picker holding a `CalendarDate` is only ever asked about
 * `CalendarDate`s, so the narrower function the contract takes is safe to hand over.
 */
const asDateValueCallback = (
  callback: ((date: CalendarDate) => boolean) | undefined,
): ((date: DateValue) => boolean) | undefined =>
  callback as ((date: DateValue) => boolean) | undefined;

/** Draws the calendar's header as a `div`, with the props and the ref HeroUI hands it. */
// A cast: HeroUI types the props for the `header` element it would draw, and a `div` takes the same attributes.
const renderAsDiv: NonNullable<CalendarHeaderProps["render"]> = (props) => (
  <div {...(props as unknown as ComponentProps<"div">)} />
);

/**
 * A labelled field for one calendar day, typed or chosen from a calendar that opens from a button. The value is a
 * `CalendarDate`, or `null` for an empty field; `onChange` receives each complete new day, or `null` once every segment
 * is cleared.
 */
export function DatePicker({
  label,
  description,
  errorMessage,
  variant = "primary",
  isFullWidth = true,
  calendarButtonLabel,
  minValue,
  maxValue,
  isDateUnavailable,
  isOpen,
  defaultOpen,
  onOpenChange,
  isReadOnly,
  className,
  ...rest
}: DatePickerProps) {
  const t = useUiText();
  calendarButtonLabel ??= t(UI_KEYS.ui.date_picker.calendar);
  // The picker hands its bounds to the calendar through context, but HeroUI's calendar always passes bounds of its own
  // (1900 to 2099) as props, and props win over context, so the calendar must be given the bounds itself.
  const bounds = omitUndefined({ minValue, maxValue });
  return (
    <HeroDatePicker
      {...omitUndefined(rest)}
      {...bounds}
      {...omitUndefined({
        isDateUnavailable: asDateValueCallback(isDateUnavailable),
        isReadOnly,
        isOpen,
        defaultOpen,
        // A read-only picker never opens, so nothing is reported either.
        onOpenChange: isReadOnly ? undefined : onOpenChange,
      })}
      // The button is off when read-only, but React Aria's Alt+Arrow shortcut would still open a calendar that refuses
      // every day.
      {...(isReadOnly ? { isOpen: false } : {})}
      // HeroUI's picker has no width variant of its own, so a full-width picker gets the utility, in front of the caller's.
      className={composeRenderProps(className, (own) =>
        [isFullWidth ? "w-full" : "", own].filter(Boolean).join(" "),
      )}
    >
      {label ? <Label>{label}</Label> : null}
      <DateField.Group fullWidth={isFullWidth} variant={variant}>
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} className={SEGMENT_CLASS} />}
        </DateField.Input>
        <DateField.Suffix>
          <HeroDatePicker.Trigger aria-label={calendarButtonLabel} className={BUTTON_CLASS}>
            <HeroDatePicker.TriggerIndicator />
          </HeroDatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      {/* A popover with no dialog inside is the dialog itself, and a dialog needs a name. */}
      <HeroDatePicker.Popover aria-label={calendarButtonLabel}>
        <Calendar {...bounds}>
          {/* A div, not HeroUI's `header`: inside React Aria's `application` calendar a `header` is a banner landmark. */}
          <Calendar.Header render={renderAsDiv}>
            <Calendar.Heading />
            <Calendar.NavButton slot="previous" className={MONTH_BUTTON_CLASS} />
            <Calendar.NavButton slot="next" className={MONTH_BUTTON_CLASS} />
          </Calendar.Header>
          {/* Narrow weekday names: HeroUI's short ones are whole words in Arabic and overflow its fixed-width grid.
              A day is still read by its full date. */}
          <Calendar.Grid weekdayStyle="narrow">
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </HeroDatePicker.Popover>
    </HeroDatePicker>
  );
}
