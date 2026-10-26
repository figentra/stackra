/**
 * Stackra file contract:
 * Purpose: the native `WheelTimePicker` compound on HeroUI Native Pro's WheelTimePicker (inline wheels that pick a time): the root maps `label` to
 *          `accessibilityLabel`; every other prop, `value`, `onValueChange`, `onValueCommit`, `hourFormat` and `minuteInterval`, with their `@internationalized/date` types, included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the five parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { WheelTimePicker as HeroWheelTimePicker } from "heroui-native-pro/wheel-time-picker";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { WheelTimePickerProps } from "#native/wheel-time-picker/wheel-time-picker.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function WheelTimePickerRoot({ label, isDisabled, ...rest }: WheelTimePickerProps): ReactElement {
  return (
    <HeroWheelTimePicker {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface WheelTimePickerParts {
  /** The wheel of hours. */
  readonly Hour: typeof HeroWheelTimePicker.Hour;
  /** The wheel of minutes. */
  readonly Minute: typeof HeroWheelTimePicker.Minute;
  /** The wheel of AM and PM; present in the 12-hour format only. */
  readonly Period: typeof HeroWheelTimePicker.Period;
  /** The highlight band over the selected row of every wheel. */
  readonly Indicator: typeof HeroWheelTimePicker.Indicator;
  /** The fade over the rows above and below the selected one. */
  readonly Mask: typeof HeroWheelTimePicker.Mask;
}

/**
 * A wheel time picker: `WheelTimePicker.Hour`, `Minute` and `Period` are the wheels, with `Indicator` and `Mask` laid over them. Name it for screen readers with `label`.
 */
export const WheelTimePicker: typeof WheelTimePickerRoot & WheelTimePickerParts = Object.assign(
  WheelTimePickerRoot,
  {
    Hour: HeroWheelTimePicker.Hour,
    Minute: HeroWheelTimePicker.Minute,
    Period: HeroWheelTimePicker.Period,
    Indicator: HeroWheelTimePicker.Indicator,
    Mask: HeroWheelTimePicker.Mask,
  },
);
