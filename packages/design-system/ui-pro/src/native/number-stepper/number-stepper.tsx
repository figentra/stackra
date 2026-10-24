/**
 * Stackra file contract:
 * Purpose: the native `NumberStepper` compound on HeroUI Native Pro's NumberStepper (a value with decrement and
 *          increment buttons): the root maps `label` to `accessibilityLabel`; `value`, `onValueChange`, `minValue`,
 *          `maxValue` and every other prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its
 *          `useNumberStepper` hook is re-exported as it is. The web `NumberStepper` shares its contract.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import { NumberStepper as HeroNumberStepper } from "heroui-native-pro/number-stepper";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { NumberStepperContractProps } from "#contracts/types/number-stepper-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

export { useNumberStepper } from "heroui-native-pro/number-stepper";

/**
 * Props of the native NumberStepper: the shared contract plus HeroUI Native Pro's own, passed through unchanged. The
 * accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type NumberStepperProps = NumberStepperContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroNumberStepper>,
    keyof NumberStepperContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function NumberStepperRoot({ label, isDisabled, ...rest }: NumberStepperProps): ReactElement {
  return (
    <HeroNumberStepper {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface NumberStepperParts {
  /** The surface behind the root. */
  readonly RootBackground: typeof HeroNumberStepper.RootBackground;
  /** The button that lowers the value by one step. */
  readonly DecrementButton: typeof HeroNumberStepper.DecrementButton;
  /** The surface behind a button. */
  readonly ButtonBackground: typeof HeroNumberStepper.ButtonBackground;
  /** The animated number. */
  readonly Value: typeof HeroNumberStepper.Value;
  /** The button that raises the value by one step. */
  readonly IncrementButton: typeof HeroNumberStepper.IncrementButton;
}

/**
 * A value with decrement and increment buttons: `NumberStepper.DecrementButton`, `NumberStepper.Value` and
 * `NumberStepper.IncrementButton`. Name it for screen readers with `label`.
 */
export const NumberStepper: typeof NumberStepperRoot & NumberStepperParts = Object.assign(
  NumberStepperRoot,
  {
    RootBackground: HeroNumberStepper.RootBackground,
    DecrementButton: HeroNumberStepper.DecrementButton,
    ButtonBackground: HeroNumberStepper.ButtonBackground,
    Value: HeroNumberStepper.Value,
    IncrementButton: HeroNumberStepper.IncrementButton,
  },
);
