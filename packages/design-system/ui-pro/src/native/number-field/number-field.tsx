/**
 * Stackra file contract:
 * Purpose: the native `NumberField` compound on HeroUI Native Pro's NumberField (a numeric input with stepper
 *          buttons): the root maps `label` to `accessibilityLabel`; every other prop, `value`, `minValue`, `step`,
 *          `formatOptions` and `onChange` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the four parts of HeroUI Native Pro, its own
 *          components; `Label`, `Description` and `FieldError` come from `heroui-native`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-012.
 */
import { NumberField as HeroNumberField } from "heroui-native-pro/number-field";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native NumberField: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type NumberFieldProps = NumberFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroNumberField>,
    keyof NumberFieldContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function NumberFieldRoot({ label, isDisabled, ...rest }: NumberFieldProps): ReactElement {
  return (
    <HeroNumberField {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface NumberFieldParts {
  /** The wrapper of the decrement button, the input and the increment button. */
  readonly Group: typeof HeroNumberField.Group;
  /** The input that shows the formatted number and commits it on blur. */
  readonly Input: typeof HeroNumberField.Input;
  /** The button that lowers the value by one step. */
  readonly DecrementButton: typeof HeroNumberField.DecrementButton;
  /** The button that raises the value by one step. */
  readonly IncrementButton: typeof HeroNumberField.IncrementButton;
}

/**
 * A numeric input with decrement and increment buttons: `NumberField.Group` holds `NumberField.DecrementButton`,
 * `NumberField.Input` and `NumberField.IncrementButton`. Name it for screen readers with `label`.
 */
export const NumberField: typeof NumberFieldRoot & NumberFieldParts = Object.assign(
  NumberFieldRoot,
  {
    Group: HeroNumberField.Group,
    Input: HeroNumberField.Input,
    DecrementButton: HeroNumberField.DecrementButton,
    IncrementButton: HeroNumberField.IncrementButton,
  },
);
