/**
 * Stackra file contract:
 * Purpose: the native `ProgressCircle` compound on HeroUI Native Pro's ProgressCircle (a ring that fills to a
 *          value): the root maps `tone` to HeroUI's `color` and `label` to `accessibilityLabel`; every other prop,
 *          `value`, `minValue`, `maxValue`, `isIndeterminate`, `isDisabled`, `size` (a size name or a number) and
 *          `formatOptions` included, passes through. The parts Indicator and ValueLabel are HeroUI Native Pro's own.
 * Boundary: no behaviour or styling of its own. The compound exposes the parts of HeroUI Native Pro, its own
 *          components. HeroUI Native Pro's `useProgressCircle` hook is re-exported.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { ProgressCircle as HeroProgressCircle } from "heroui-native-pro/progress-circle";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native ProgressCircle: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The colour role is `tone` and the accessible name is `label`, so HeroUI's names for them are left out
 * of the type.
 */
export type ProgressCircleProps = ProgressCircleContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroProgressCircle>,
    keyof ProgressCircleContractProps | "color" | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `tone` as its `color` and `label` as the accessibility label. */
function ProgressCircleRoot({ tone, label, ...rest }: ProgressCircleProps): ReactElement {
  return (
    <HeroProgressCircle {...rest} {...omitUndefined({ color: tone, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface ProgressCircleParts {
  /** The ring: its track and the arc that fills it. */
  readonly Indicator: typeof HeroProgressCircle.Indicator;
  /** The text that shows the formatted value. */
  readonly ValueLabel: typeof HeroProgressCircle.ValueLabel;
}

/**
 * A progress ring: `ProgressCircle.Indicator` draws the ring and `ProgressCircle.ValueLabel` the value inside it. Name
 * it for screen readers with `label`.
 */
export const ProgressCircle: typeof ProgressCircleRoot & ProgressCircleParts = Object.assign(
  ProgressCircleRoot,
  {
    Indicator: HeroProgressCircle.Indicator,
    ValueLabel: HeroProgressCircle.ValueLabel,
  },
);

export { useProgressCircle } from "heroui-native-pro/progress-circle";
