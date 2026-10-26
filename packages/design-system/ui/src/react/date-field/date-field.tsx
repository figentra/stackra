/**
 * Stackra file contract:
 * Purpose: the web `DateField` on HeroUI v3's DateField: one component that draws the label, the group of editable day,
 *          month and year segments, the description and the error message of a date field, maps the shared field contract
 *          (`isFullWidth` to `fullWidth` on the field and its group, `variant` to the group's look, one default each
 *          for `primary` and full width) and passes every other React Aria date field prop (`minValue`, `maxValue`,
 *          `isDateUnavailable`, `validationBehavior`, `className`, `aria-label`) through to HeroUI's root. The value is a
 *          `CalendarDate` of `@internationalized/date`, or `null` for an empty field.
 * Boundary: no styling of its own beyond the minimum size of a segment; the look is HeroUI's, themed by
 *           `@stackra/tokens`. The order of the segments, the digits and the calendar follow the locale of React Aria's
 *           `I18nProvider`, which the DesignSystemProvider sets. A day before `minValue`, after `maxValue` or refused by
 *           `isDateUnavailable` makes the field invalid; whether that shows while typing or only on submit is React
 *           Aria's `validationBehavior` (`native` by default, `aria` to show it at once). A disabled field is left out of
 *           the submit and a read-only one keeps focus but refuses every segment change. A field without a visible
 *           `label` is named by the caller with `aria-label`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decision 7); ADR 0165 (UI contract, HeroUI
 *          v3 on web); ADR 0055 (forms: one field contract); WCAG 2.2 SC 2.5.8; owner decision 6 of STA-350 (thin
 *          wrappers).
 */
import { DateField as HeroDateField, Description, FieldError, Label } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { DateFieldProps } from "#react/date-field/date-field.props";

/**
 * A segment is at least 24 CSS pixels each way: HeroUI's is about 20 pixels high and, with a day or month in two digits,
 * narrower than that, and the segments sit side by side, which is under the minimum target of WCAG 2.2 SC 2.5.8.
 */
const SEGMENT_CLASS = "min-h-6 min-w-6";

/**
 * React Aria types the callback for every kind of date, but a field holding a `CalendarDate` is only ever asked about
 * `CalendarDate`s, so the narrower function the contract takes is safe to hand over.
 */
const asDateValueCallback = (
  callback: ((date: CalendarDate) => boolean) | undefined,
): ((date: DateValue) => boolean) | undefined =>
  callback as ((date: DateValue) => boolean) | undefined;

/**
 * A labelled field for one calendar day, typed segment by segment. The value is a `CalendarDate`, or `null` for an empty
 * field; `onChange` receives each complete new day, or `null` once every segment is cleared.
 */
export function DateField({
  label,
  description,
  errorMessage,
  variant = "primary",
  isFullWidth = true,
  isDateUnavailable,
  ...rest
}: DateFieldProps) {
  return (
    <HeroDateField
      {...omitUndefined(rest)}
      {...omitUndefined({ isDateUnavailable: asDateValueCallback(isDateUnavailable) })}
      fullWidth={isFullWidth}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroDateField.Group fullWidth={isFullWidth} variant={variant}>
        <HeroDateField.Input>
          {(segment) => <HeroDateField.Segment segment={segment} className={SEGMENT_CLASS} />}
        </HeroDateField.Input>
      </HeroDateField.Group>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroDateField>
  );
}
