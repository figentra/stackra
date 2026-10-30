/**
 * Stackra file contract:
 * Purpose: the web `WheelTimePicker`: a time of day on hour and minute wheels, plus a period wheel in a 12-hour cycle,
 *          in the locale's period names and the customer's digits.
 * Boundary: the wheels are WheelPicker's, the columns `wheelTimeColumnsOf`'s. The hour cycle is the locale's unless
 *           given. Hours and minutes always read left to right, as clocks do in Arabic too.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0192.
 */
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { hourCycleOf } from "#core/functions/hour-cycle-of.function";
import { timeOfWheels } from "#core/functions/time-of-wheels.function";
import { wheelTimeColumnsOf } from "#core/functions/wheel-time-columns-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { WheelPicker } from "#react/wheel-picker/wheel-picker";
import type { WheelTimePickerProps } from "#react/wheel-picker/wheel-time-picker.props";

/** A time of day on wheels. */
export function WheelTimePicker({
  value,
  defaultValue,
  onChange,
  minuteStep = 1,
  hourCycle,
  ...rest
}: WheelTimePickerProps): ReactElement {
  const { locale } = useLocale();
  const numerals = useNumerals();
  const t = useUiText();
  const K = FORMS_KEYS.ui.wheel;
  const cycle = hourCycle ?? hourCycleOf(locale);
  const [own, setOwn] = useState(() => defaultValue ?? { hour: 0, minute: 0 });
  const time = value ?? own;
  const { columns, value: keys } = wheelTimeColumnsOf({
    value: time,
    minuteStep,
    hourCycle: cycle,
    locale,
    numerals,
    labels: { hour: t(K.hour), minute: t(K.minute), period: t(K.period) },
  });
  return (
    <WheelPicker
      dir="ltr"
      {...rest}
      columns={columns}
      value={keys}
      onChange={(next) => {
        const chosen = timeOfWheels(next, cycle);
        if (value === undefined) setOwn(chosen);
        onChange?.(chosen);
      }}
    />
  );
}
