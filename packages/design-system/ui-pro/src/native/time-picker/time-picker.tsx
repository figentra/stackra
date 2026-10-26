/**
 * Stackra file contract:
 * Purpose: the native `TimePicker` compound on HeroUI Native Pro's TimePicker (a trigger field that opens time wheels): the root maps `label` to
 *          `accessibilityLabel`; every other prop, `value`, `onValueChange`, `hourFormat`, `minuteInterval` and `formatTime` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the thirteen parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { TimePicker as HeroTimePicker } from "heroui-native-pro/time-picker";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { TimePickerProps } from "#native/time-picker/time-picker.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function TimePickerRoot({ label, isDisabled, ...rest }: TimePickerProps): ReactElement {
  return <HeroTimePicker {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface TimePickerParts {
  /** The select root wired to the time picker's state. */
  readonly Select: typeof HeroTimePicker.Select;
  /** The portal that carries the time picker's context across the overlay boundary. */
  readonly Portal: typeof HeroTimePicker.Portal;
  /** The backdrop behind the content. */
  readonly Overlay: typeof HeroTimePicker.Overlay;
  /** The popup container: a popover, a dialog or a bottom sheet. */
  readonly Content: typeof HeroTimePicker.Content;
  /** The pressable trigger that opens the wheels. */
  readonly Trigger: typeof HeroTimePicker.Trigger;
  /** The text of the picked value, or the placeholder. */
  readonly Value: typeof HeroTimePicker.Value;
  /** The chevron inside the trigger. */
  readonly TriggerIndicator: typeof HeroTimePicker.TriggerIndicator;
  /** The wheel group that commits the picked time to the trigger. */
  readonly Wheel: typeof HeroTimePicker.Wheel;
  /** The wheel of hours. */
  readonly WheelHour: typeof HeroTimePicker.WheelHour;
  /** The wheel of minutes. */
  readonly WheelMinute: typeof HeroTimePicker.WheelMinute;
  /** The wheel of AM and PM; present in the 12-hour format only. */
  readonly WheelPeriod: typeof HeroTimePicker.WheelPeriod;
  /** The highlight band over the selected row of every wheel. */
  readonly WheelIndicator: typeof HeroTimePicker.WheelIndicator;
  /** The fade over the rows above and below the selected one. */
  readonly WheelMask: typeof HeroTimePicker.WheelMask;
}

/**
 * A time picker: `TimePicker.Select` holds `TimePicker.Trigger` and, in `TimePicker.Portal`, the `TimePicker.Overlay` and `TimePicker.Content` with a `TimePicker.Wheel` of `WheelHour`, `WheelMinute` and `WheelPeriod`. Name it for screen readers with `label`.
 */
export const TimePicker: typeof TimePickerRoot & TimePickerParts = Object.assign(TimePickerRoot, {
  Select: HeroTimePicker.Select,
  Portal: HeroTimePicker.Portal,
  Overlay: HeroTimePicker.Overlay,
  Content: HeroTimePicker.Content,
  Trigger: HeroTimePicker.Trigger,
  Value: HeroTimePicker.Value,
  TriggerIndicator: HeroTimePicker.TriggerIndicator,
  Wheel: HeroTimePicker.Wheel,
  WheelHour: HeroTimePicker.WheelHour,
  WheelMinute: HeroTimePicker.WheelMinute,
  WheelPeriod: HeroTimePicker.WheelPeriod,
  WheelIndicator: HeroTimePicker.WheelIndicator,
  WheelMask: HeroTimePicker.WheelMask,
});
