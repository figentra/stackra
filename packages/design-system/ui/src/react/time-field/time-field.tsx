/**
 * Stackra file contract:
 * Purpose: the web `TimeField` on HeroUI v3's TimeField: a label, hour and minute segments typed or stepped with the
 *          arrow keys (and the period in a 12-hour cycle), the description and the error. The value is a plain
 *          `{ hour, minute }`; React Aria's `Time` is made and read here.
 * Boundary: no styling beyond the 24px minimum of a segment. The segments are React Aria's spin buttons, read with
 *           their names; the digits follow the locale's `-u-nu-` keyword.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 2.1.1, 2.5.8, 4.1.2.
 */
import { Description, FieldError, Label, TimeField as HeroTimeField, cn } from "@heroui/react";
import { Time } from "@internationalized/date";
import type { ReactElement, ReactNode } from "react";

import type { TimeValue } from "#contracts/types/time-value.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { TimeFieldProps } from "#react/time-field/time-field.props";

/** A plain time as React Aria's `Time`; `null` stays `null`, `undefined` stays unset. */
const toTime = (value: TimeValue | null | undefined) =>
  value == null ? value : new Time(value.hour, value.minute);

/** A labelled field over a time of day. `end` is drawn at the inline end of the group (the TimePicker's button). */
export function TimeField({
  label,
  description,
  errorMessage,
  variant = "primary",
  isFullWidth = true,
  value,
  defaultValue,
  onChange,
  hourCycle,
  className,
  end,
  ...rest
}: TimeFieldProps & { readonly end?: ReactNode }): ReactElement {
  return (
    <HeroTimeField
      {...omitUndefined(rest)}
      {...omitUndefined({ hourCycle, value: toTime(value), defaultValue: toTime(defaultValue) })}
      onChange={(time) => onChange?.(time ? { hour: time.hour, minute: time.minute } : null)}
      className={
        cn(isFullWidth && "w-full", typeof className === "string" ? className : undefined) ?? ""
      }
    >
      {label ? <Label>{label}</Label> : null}
      <HeroTimeField.Group fullWidth={isFullWidth} variant={variant}>
        <HeroTimeField.Input>
          {(segment) => <HeroTimeField.Segment segment={segment} className="min-h-6 min-w-6" />}
        </HeroTimeField.Input>
        {end ? <HeroTimeField.Suffix>{end}</HeroTimeField.Suffix> : null}
      </HeroTimeField.Group>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTimeField>
  );
}
