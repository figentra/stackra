/**
 * Stackra file contract:
 * Purpose: the web `Stepper` compound on HeroUI Pro's Stepper: the root takes the shared `size` and names the step
 *          list from `label`; every part (Step, Indicator, Content, Title, Description, Icon, Separator) and the
 *          `useStep` hook are HeroUI Pro's own. `currentStep`, `defaultStep`, `onStepChange` and `orientation` pass
 *          through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The native `Stepper` shares
 *          the `label` contract. The compound exposes the documented parts: HeroUI Pro's `Stepper.Root` is left out.
 *          Imports the `stepper` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import { Stepper as HeroStepper } from "@heroui-pro/react/stepper";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { StepperProps } from "#react/stepper/stepper.props";

/** The step list: HeroUI Pro's `Stepper.Root`, an ordered list named by `label`. */
function StepperRoot({ size, label, ...rest }: StepperProps) {
  return <HeroStepper.Root {...rest} {...omitUndefined({ size, "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface StepperParts {
  /** One step of the sequence. */
  readonly Step: typeof HeroStepper.Step;
  /** The marker of a step: its number, or a check once complete. */
  readonly Indicator: typeof HeroStepper.Indicator;
  /** The text column of a step. */
  readonly Content: typeof HeroStepper.Content;
  /** The name of a step. */
  readonly Title: typeof HeroStepper.Title;
  /** A line of detail under the title. */
  readonly Description: typeof HeroStepper.Description;
  /** An icon that replaces the indicator's number. */
  readonly Icon: typeof HeroStepper.Icon;
  /** The line between two steps, filled as the steps complete. */
  readonly Separator: typeof HeroStepper.Separator;
  /** Reads the index, status and last-step flag of the step it is inside. */
  readonly useStep: typeof HeroStepper.useStep;
}

/**
 * A sequence of steps: each `Stepper.Step` holds a `Stepper.Indicator`, a `Stepper.Content` with `Title` and
 * `Description`, and a `Stepper.Separator`. Name the list for screen readers with `label`.
 */
export const Stepper: typeof StepperRoot & StepperParts = Object.assign(StepperRoot, {
  Step: HeroStepper.Step,
  Indicator: HeroStepper.Indicator,
  Content: HeroStepper.Content,
  Title: HeroStepper.Title,
  Description: HeroStepper.Description,
  Icon: HeroStepper.Icon,
  Separator: HeroStepper.Separator,
  useStep: HeroStepper.useStep,
});
