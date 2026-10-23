/**
 * Stackra file contract:
 * Purpose: the native `DateTimePicker` compound on HeroUI Native Pro's DateTimePicker (a trigger field that opens date and time wheels): the root maps `label` to
 *          `accessibilityLabel`; every other prop, `value`, `onValueChange`, `hourFormat`, `minuteInterval` and `formatDateTime` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the fourteen parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { DateTimePicker as HeroDateTimePicker } from "heroui-native-pro/date-time-picker";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native DateTimePicker: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type DateTimePickerProps = DatePickerContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroDateTimePicker>,
    keyof DatePickerContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function DateTimePickerRoot({ label, isDisabled, ...rest }: DateTimePickerProps): ReactElement {
  return (
    <HeroDateTimePicker {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface DateTimePickerParts {
  /** The select root wired to the date and time picker's state. */
  readonly Select: typeof HeroDateTimePicker.Select;
  /** The portal that carries the date and time picker's context across the overlay boundary. */
  readonly Portal: typeof HeroDateTimePicker.Portal;
  /** The backdrop behind the content. */
  readonly Overlay: typeof HeroDateTimePicker.Overlay;
  /** The popup container: a popover, a dialog or a bottom sheet. */
  readonly Content: typeof HeroDateTimePicker.Content;
  /** The pressable trigger that opens the wheels. */
  readonly Trigger: typeof HeroDateTimePicker.Trigger;
  /** The text of the picked value, or the placeholder. */
  readonly Value: typeof HeroDateTimePicker.Value;
  /** The chevron inside the trigger. */
  readonly TriggerIndicator: typeof HeroDateTimePicker.TriggerIndicator;
  /** The wheel group that commits the picked date and time to the trigger. */
  readonly Wheel: typeof HeroDateTimePicker.Wheel;
  /** The wheel of dates. */
  readonly WheelDate: typeof HeroDateTimePicker.WheelDate;
  /** The wheel of hours. */
  readonly WheelHour: typeof HeroDateTimePicker.WheelHour;
  /** The wheel of minutes. */
  readonly WheelMinute: typeof HeroDateTimePicker.WheelMinute;
  /** The wheel of AM and PM; present in the 12-hour format only. */
  readonly WheelPeriod: typeof HeroDateTimePicker.WheelPeriod;
  /** The highlight band over the selected row of every wheel. */
  readonly WheelIndicator: typeof HeroDateTimePicker.WheelIndicator;
  /** The fade over the rows above and below the selected one. */
  readonly WheelMask: typeof HeroDateTimePicker.WheelMask;
}

/**
 * A date and time picker: `DateTimePicker.Select` holds `DateTimePicker.Trigger` and, in `DateTimePicker.Portal`, the `DateTimePicker.Overlay` and `DateTimePicker.Content` with a `DateTimePicker.Wheel` of `WheelDate`, `WheelHour`, `WheelMinute` and `WheelPeriod`. Name it for screen readers with `label`.
 */
export const DateTimePicker: typeof DateTimePickerRoot & DateTimePickerParts = Object.assign(
  DateTimePickerRoot,
  {
    Select: HeroDateTimePicker.Select,
    Portal: HeroDateTimePicker.Portal,
    Overlay: HeroDateTimePicker.Overlay,
    Content: HeroDateTimePicker.Content,
    Trigger: HeroDateTimePicker.Trigger,
    Value: HeroDateTimePicker.Value,
    TriggerIndicator: HeroDateTimePicker.TriggerIndicator,
    Wheel: HeroDateTimePicker.Wheel,
    WheelDate: HeroDateTimePicker.WheelDate,
    WheelHour: HeroDateTimePicker.WheelHour,
    WheelMinute: HeroDateTimePicker.WheelMinute,
    WheelPeriod: HeroDateTimePicker.WheelPeriod,
    WheelIndicator: HeroDateTimePicker.WheelIndicator,
    WheelMask: HeroDateTimePicker.WheelMask,
  },
);
