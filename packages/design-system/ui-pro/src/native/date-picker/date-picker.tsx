/**
 * Stackra file contract:
 * Purpose: the native `DatePicker` compound on HeroUI Native Pro's DatePicker (a trigger field that opens a
 *          calendar): the root maps `label` to `accessibilityLabel`; every other prop, `value`, `onValueChange`,
 *          `dateDisplayFormat` and `formatDate` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the eight parts of HeroUI Native Pro, its own
 *          components; `Label`, `Description` and `FieldError` come from `heroui-native`, and the calendar's own
 *          parts from `Calendar`. The `value` is HeroUI's `DatePickerOption` (an ISO date string and a label).
 * Runtime: react-native
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-011.
 */
import { DatePicker as HeroDatePicker } from "heroui-native-pro/date-picker";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native DatePicker: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type DatePickerProps = DatePickerContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroDatePicker>,
    keyof DatePickerContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function DatePickerRoot({ label, isDisabled, ...rest }: DatePickerProps): ReactElement {
  return <HeroDatePicker {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface DatePickerParts {
  /** The select root wired to the date picker's state. */
  readonly Select: typeof HeroDatePicker.Select;
  /** The portal that carries the date picker's context across the overlay boundary. */
  readonly Portal: typeof HeroDatePicker.Portal;
  /** The backdrop behind the calendar. */
  readonly Overlay: typeof HeroDatePicker.Overlay;
  /** The popup container: a popover, a dialog or a bottom sheet. */
  readonly Content: typeof HeroDatePicker.Content;
  /** The calendar that commits the picked date, updates the trigger and closes the overlay. */
  readonly Calendar: typeof HeroDatePicker.Calendar;
  /** The pressable trigger that opens the calendar. */
  readonly Trigger: typeof HeroDatePicker.Trigger;
  /** The text of the picked date, or the placeholder. */
  readonly Value: typeof HeroDatePicker.Value;
  /** The calendar icon inside the trigger. */
  readonly TriggerIndicator: typeof HeroDatePicker.TriggerIndicator;
}

/**
 * A single-date picker: `DatePicker.Select` holds `DatePicker.Trigger` and, in `DatePicker.Portal`, the
 * `DatePicker.Overlay` and `DatePicker.Content` with a `DatePicker.Calendar`. Name it for screen readers with `label`.
 */
export const DatePicker: typeof DatePickerRoot & DatePickerParts = Object.assign(DatePickerRoot, {
  Select: HeroDatePicker.Select,
  Portal: HeroDatePicker.Portal,
  Overlay: HeroDatePicker.Overlay,
  Content: HeroDatePicker.Content,
  Calendar: HeroDatePicker.Calendar,
  Trigger: HeroDatePicker.Trigger,
  Value: HeroDatePicker.Value,
  TriggerIndicator: HeroDatePicker.TriggerIndicator,
});
