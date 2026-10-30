/**
 * Stackra file contract:
 * Purpose: the native `TimeField`: a labelled field over a time of day that opens a WheelTimePicker in a modal; the
 *          time is written in the locale's format and the customer's digits.
 * Boundary: the shell is PickerField's; the wheel's choice is kept on Done and dropped on Cancel.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import { dateTimeFormatIn } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";

import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { TimeValue } from "#contracts/types/time-value.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { PickerField } from "#native/time-field/picker-field";
import { WheelTimePicker } from "#native/wheel-picker/wheel-time-picker";
import type { TimeFieldProps } from "#native/time-field/time-field.props";

/** A labelled field over a time of day. The TimePicker adds the clock button and the wheel's minute step. */
export function TimeField({
  value,
  defaultValue,
  onChange,
  hourCycle,
  name: _name,
  pickerButtonLabel,
  minuteStep = 1,
  ...field
}: TimeFieldProps &
  OpenStateContractProps & {
    readonly pickerButtonLabel?: string | undefined;
    readonly minuteStep?: number | undefined;
  }): ReactElement {
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const [own, setOwn] = useState<TimeValue | null>(defaultValue ?? null);
  const time = value === undefined ? own : value;
  const [shown, setShown] = useState<TimeValue | null>(null);
  const text = time
    ? dateTimeFormatIn(
        locale,
        {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "UTC",
          ...(hourCycle ? { hour12: hourCycle === 12 } : {}),
        },
        numerals,
        // oxlint-disable-next-line react/capitalized-calls -- Date.UTC is the built-in date function, not a component
      ).format(new Date(Date.UTC(2000, 0, 1, time.hour, time.minute)))
    : "";
  return (
    <PickerField
      {...field}
      text={text}
      icon="clock"
      buttonLabel={pickerButtonLabel}
      onOpenChange={(open) => {
        if (open) setShown(null);
        field.onOpenChange?.(open);
      }}
      onDone={() => {
        const next = shown ?? time ?? { hour: 9, minute: 0 };
        if (value === undefined) setOwn(next);
        onChange?.(next);
      }}
    >
      <WheelTimePicker
        value={shown ?? time ?? { hour: 9, minute: 0 }}
        onChange={setShown}
        minuteStep={minuteStep}
        {...omitUndefined({ hourCycle })}
      />
    </PickerField>
  );
}
