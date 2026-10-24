/**
 * Stackra file contract:
 * Purpose: the native `WheelDateTimePicker` compound on HeroUI Native Pro's WheelDateTimePicker (inline wheels that pick a date and a time): the root maps `label` to
 *          `accessibilityLabel`; every other prop, `value`, `onValueChange`, `onValueCommit`, `minValue`, `maxValue`, `hourFormat` and `minuteInterval`, with their `@internationalized/date` types, included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the six parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { WheelDateTimePicker as HeroWheelDateTimePicker } from "heroui-native-pro/wheel-date-time-picker";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native WheelDateTimePicker: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type WheelDateTimePickerProps = DatePickerContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroWheelDateTimePicker>,
    keyof DatePickerContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function WheelDateTimePickerRoot({
  label,
  isDisabled,
  ...rest
}: WheelDateTimePickerProps): ReactElement {
  return (
    <HeroWheelDateTimePicker
      {...rest}
      {...omitUndefined({ isDisabled, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface WheelDateTimePickerParts {
  /** The wheel of dates. */
  readonly Date: typeof HeroWheelDateTimePicker.Date;
  /** The wheel of hours. */
  readonly Hour: typeof HeroWheelDateTimePicker.Hour;
  /** The wheel of minutes. */
  readonly Minute: typeof HeroWheelDateTimePicker.Minute;
  /** The wheel of AM and PM; present in the 12-hour format only. */
  readonly Period: typeof HeroWheelDateTimePicker.Period;
  /** The highlight band over the selected row of every wheel. */
  readonly Indicator: typeof HeroWheelDateTimePicker.Indicator;
  /** The fade over the rows above and below the selected one. */
  readonly Mask: typeof HeroWheelDateTimePicker.Mask;
}

/**
 * A wheel date and time picker: `WheelDateTimePicker.Date`, `Hour`, `Minute` and `Period` are the wheels, with `Indicator` and `Mask` laid over them. Name it for screen readers with `label`.
 */
export const WheelDateTimePicker: typeof WheelDateTimePickerRoot & WheelDateTimePickerParts =
  Object.assign(WheelDateTimePickerRoot, {
    Date: HeroWheelDateTimePicker.Date,
    Hour: HeroWheelDateTimePicker.Hour,
    Minute: HeroWheelDateTimePicker.Minute,
    Period: HeroWheelDateTimePicker.Period,
    Indicator: HeroWheelDateTimePicker.Indicator,
    Mask: HeroWheelDateTimePicker.Mask,
  });
