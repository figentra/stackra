/**
 * Stackra file contract:
 * Purpose: the native `WheelTimePicker`: hour and minute wheels, plus a period wheel in a 12-hour cycle, in the
 *          locale's period names and the customer's digits.
 * Boundary: the wheels are WheelPicker's, the columns `wheelTimeColumnsOf`'s; the hour cycle is the locale's unless
 *           given. Hours and minutes keep the left-to-right order a clock has in Arabic too.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0192.
 */
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { hourCycleOf } from "#core/functions/hour-cycle-of.function";
import { timeOfWheels } from "#core/functions/time-of-wheels.function";
import { wheelTimeColumnsOf } from "#core/functions/wheel-time-columns-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { WheelPicker } from "#native/wheel-picker/wheel-picker";
import type { WheelTimePickerProps } from "#native/wheel-picker/wheel-time-picker.props";

/** A time of day on wheels. */
export function WheelTimePicker({
  value,
  defaultValue,
  onChange,
  minuteStep = 1,
  hourCycle,
  ...rest
}: WheelTimePickerProps): ReactElement {
  const { locale } = useDesignSystem();
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
    <View style={{ direction: "ltr" }}>
      <WheelPicker
        {...rest}
        columns={columns}
        value={keys}
        onChange={(next) => {
          const chosen = timeOfWheels(next, cycle);
          if (value === undefined) setOwn(chosen);
          onChange?.(chosen);
        }}
      />
    </View>
  );
}
