/**
 * Stackra file contract:
 * Purpose: the web `NumberStepper` compound on HeroUI Pro's NumberStepper (a numeric input with increment and
 *          decrement controls): the root maps `label` to `aria-label`; the `size` (already `sm`, `md` or `lg`),
 *          `value`, `minValue`, `onChange` and every other prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `NumberStepper.Root` is left out. Imports the `number-stepper` subpath, the
 *          only way to reach it (it needs the optional `@number-flow/react` peer). The native `NumberStepper` shares
 *          its contract.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import { NumberStepper as HeroNumberStepper } from "@heroui-pro/react/number-stepper";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { NumberStepperProps } from "#react/number-stepper/number-stepper.props";

/** The root: HeroUI Pro's, with `label` as the accessible name. */
function NumberStepperRoot({ label, isDisabled, ...rest }: NumberStepperProps) {
  return (
    <HeroNumberStepper.Root {...rest} {...omitUndefined({ isDisabled, "aria-label": label })} />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface NumberStepperParts {
  /** The wrapper of the decrement button, the value and the increment button. */
  readonly Group: typeof HeroNumberStepper.Group;
  /** The animated number. */
  readonly Value: typeof HeroNumberStepper.Value;
  /** The button that lowers the value by one step. */
  readonly DecrementButton: typeof HeroNumberStepper.DecrementButton;
  /** The button that raises the value by one step. */
  readonly IncrementButton: typeof HeroNumberStepper.IncrementButton;
}

/**
 * A numeric input with decrement and increment buttons: `NumberStepper.Group` holds `NumberStepper.DecrementButton`,
 * `NumberStepper.Value` and `NumberStepper.IncrementButton`. Name it for screen readers with `label`.
 */
export const NumberStepper: typeof NumberStepperRoot & NumberStepperParts = Object.assign(
  NumberStepperRoot,
  {
    Group: HeroNumberStepper.Group,
    Value: HeroNumberStepper.Value,
    DecrementButton: HeroNumberStepper.DecrementButton,
    IncrementButton: HeroNumberStepper.IncrementButton,
  },
);
