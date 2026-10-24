/**
 * Stackra file contract:
 * Purpose: the native `WheelPickerGroup` compound on HeroUI Native Pro's WheelPickerGroup (several wheels that share
 *          one indicator): the root maps `label` to `accessibilityLabel`; `itemHeight`, `visibleCount`,
 *          `onValuesChange` and every other prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its
 *          `useWheelPickerGroup` hook is re-exported as it is.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import { WheelPickerGroup as HeroWheelPickerGroup } from "heroui-native-pro/wheel-picker-group";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { WheelPickerGroupContractProps } from "#contracts/types/wheel-picker-group-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

export { useWheelPickerGroup } from "heroui-native-pro/wheel-picker-group";

/**
 * Props of the native WheelPickerGroup: the shared contract plus HeroUI Native Pro's own, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type WheelPickerGroupProps = WheelPickerGroupContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroWheelPickerGroup>,
    keyof WheelPickerGroupContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function WheelPickerGroupRoot({ label, isDisabled, ...rest }: WheelPickerGroupProps): ReactElement {
  return (
    <HeroWheelPickerGroup {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface WheelPickerGroupParts {
  /** The band that marks the selected row across every wheel. */
  readonly Indicator: typeof HeroWheelPickerGroup.Indicator;
  /** The surface behind the indicator. */
  readonly IndicatorBackground: typeof HeroWheelPickerGroup.IndicatorBackground;
  /** The fade over the top and bottom rows of every wheel. */
  readonly Mask: typeof HeroWheelPickerGroup.Mask;
}

/**
 * Several wheels that share one indicator: put `WheelPicker`s inside, and add `WheelPickerGroup.Indicator` or
 * `WheelPickerGroup.Mask` to customise the overlays. Name it for screen readers with `label`.
 */
export const WheelPickerGroup: typeof WheelPickerGroupRoot & WheelPickerGroupParts = Object.assign(
  WheelPickerGroupRoot,
  {
    Indicator: HeroWheelPickerGroup.Indicator,
    IndicatorBackground: HeroWheelPickerGroup.IndicatorBackground,
    Mask: HeroWheelPickerGroup.Mask,
  },
);
