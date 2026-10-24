/**
 * Stackra file contract:
 * Purpose: the native `DateRangePicker` compound on HeroUI Native Pro's DateRangePicker (a trigger field that opens a range calendar): the root maps `label` to
 *          `accessibilityLabel`; every other prop, `value`, `onValueChange`, `dateDisplayFormat`, `rangeSeparator` and `formatDateRange` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the eight parts of HeroUI Native Pro, its own
 *          components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import { DateRangePicker as HeroDateRangePicker } from "heroui-native-pro/date-range-picker";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native DateRangePicker: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type DateRangePickerProps = DatePickerContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroDateRangePicker>,
    keyof DatePickerContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function DateRangePickerRoot({ label, isDisabled, ...rest }: DateRangePickerProps): ReactElement {
  return (
    <HeroDateRangePicker {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface DateRangePickerParts {
  /** The select root wired to the date range picker's state. */
  readonly Select: typeof HeroDateRangePicker.Select;
  /** The portal that carries the date range picker's context across the overlay boundary. */
  readonly Portal: typeof HeroDateRangePicker.Portal;
  /** The backdrop behind the content. */
  readonly Overlay: typeof HeroDateRangePicker.Overlay;
  /** The popup container: a popover, a dialog or a bottom sheet. */
  readonly Content: typeof HeroDateRangePicker.Content;
  /** The range calendar that commits the picked range, updates the trigger and closes the overlay. */
  readonly Calendar: typeof HeroDateRangePicker.Calendar;
  /** The pressable trigger that opens the range calendar. */
  readonly Trigger: typeof HeroDateRangePicker.Trigger;
  /** The text of the picked value, or the placeholder. */
  readonly Value: typeof HeroDateRangePicker.Value;
  /** The chevron inside the trigger. */
  readonly TriggerIndicator: typeof HeroDateRangePicker.TriggerIndicator;
}

/**
 * A date range picker: `DateRangePicker.Select` holds `DateRangePicker.Trigger` and, in `DateRangePicker.Portal`, the `DateRangePicker.Overlay` and `DateRangePicker.Content` with a `DateRangePicker.Calendar`. Name it for screen readers with `label`.
 */
export const DateRangePicker: typeof DateRangePickerRoot & DateRangePickerParts = Object.assign(
  DateRangePickerRoot,
  {
    Select: HeroDateRangePicker.Select,
    Portal: HeroDateRangePicker.Portal,
    Overlay: HeroDateRangePicker.Overlay,
    Content: HeroDateRangePicker.Content,
    Calendar: HeroDateRangePicker.Calendar,
    Trigger: HeroDateRangePicker.Trigger,
    Value: HeroDateRangePicker.Value,
    TriggerIndicator: HeroDateRangePicker.TriggerIndicator,
  },
);
