/**
 * Stackra file contract:
 * Purpose: the native `WheelPicker` compound on HeroUI Native Pro's WheelPicker (a scrolling wheel of options): the
 *          root maps `label` to `accessibilityLabel`; `items`, `value`, `onValueChange`, `visibleCount` and every other
 *          prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its two hooks
 *          are re-exported as they are.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import {
  WheelPicker as HeroWheelPicker,
  type WheelPickerRootProps as HeroWheelPickerRootProps,
} from "heroui-native-pro/wheel-picker";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { WheelPickerProps } from "#native/wheel-picker/wheel-picker.props";

export { useWheelPicker, useWheelPickerItem } from "heroui-native-pro/wheel-picker";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function WheelPickerRoot<T = unknown>({
  label,
  isDisabled,
  ...rest
}: WheelPickerProps<T>): ReactElement | null {
  return (
    <HeroWheelPicker<T>
      {...(rest as HeroWheelPickerRootProps<T>)}
      {...omitUndefined({ isDisabled, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface WheelPickerParts {
  /** One row of the wheel, for a custom row. */
  readonly Item: typeof HeroWheelPicker.Item;
  /** The text of a row. */
  readonly ItemLabel: typeof HeroWheelPicker.ItemLabel;
  /** The band that marks the selected row. */
  readonly Indicator: typeof HeroWheelPicker.Indicator;
  /** The surface behind the indicator. */
  readonly IndicatorBackground: typeof HeroWheelPicker.IndicatorBackground;
  /** The fade over the top and bottom rows. */
  readonly Mask: typeof HeroWheelPicker.Mask;
}

/**
 * A scrolling wheel of options: pass `items`, and add `WheelPicker.Indicator` or `WheelPicker.Mask` to customise the
 * overlays. Name it for screen readers with `label`.
 */
export const WheelPicker: typeof WheelPickerRoot & WheelPickerParts = Object.assign(
  WheelPickerRoot,
  {
    Item: HeroWheelPicker.Item,
    ItemLabel: HeroWheelPicker.ItemLabel,
    Indicator: HeroWheelPicker.Indicator,
    IndicatorBackground: HeroWheelPicker.IndicatorBackground,
    Mask: HeroWheelPicker.Mask,
  },
);
