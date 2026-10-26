/**
 * Stackra file contract:
 * Purpose: the native `Stepper` compound on HeroUI Native Pro's Stepper: the root names the step list from `label` as
 *          the accessibility label, and every part (Step, Rail, Indicator, IndicatorCheck, IndicatorNumber,
 *          Separator, SeparatorTrack, SeparatorFill, Content, Title, Description) and hook (`useStepper`,
 *          `useStepperAnimation`, `useStepperStep`) is HeroUI Native Pro's own. `currentStep`, `defaultStep`,
 *          `onStepChange` and `orientation` pass through.
 * Boundary: no behaviour or styling of its own. HeroUI Native Pro's stepper has no size, so the shared `size` is
 *          web only. The web `Stepper` shares the `label` contract. Imports the `stepper` subpath.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import { Stepper as HeroStepper } from "heroui-native-pro/stepper";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { StepperProps } from "#native/stepper/stepper.props";

/** The step list: HeroUI Native Pro's root, named by `label` as its accessibility label. */
function StepperRoot({ label, ...rest }: StepperProps): ReactElement {
  return <HeroStepper {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface StepperParts {
  /** One step of the sequence. */
  readonly Step: typeof HeroStepper.Step;
  /** The row that holds a step's indicator and separator. */
  readonly Rail: typeof HeroStepper.Rail;
  /** The marker of a step. */
  readonly Indicator: typeof HeroStepper.Indicator;
  /** An animated check for a complete step, drawn inside an indicator. */
  readonly IndicatorCheck: typeof HeroStepper.IndicatorCheck;
  /** The step's number, drawn inside an indicator. */
  readonly IndicatorNumber: typeof HeroStepper.IndicatorNumber;
  /** The line between two steps. */
  readonly Separator: typeof HeroStepper.Separator;
  /** The empty track of a separator. */
  readonly SeparatorTrack: typeof HeroStepper.SeparatorTrack;
  /** The animated fill of a separator. */
  readonly SeparatorFill: typeof HeroStepper.SeparatorFill;
  /** The text column of a step. */
  readonly Content: typeof HeroStepper.Content;
  /** The name of a step. */
  readonly Title: typeof HeroStepper.Title;
  /** A line of detail under the title. */
  readonly Description: typeof HeroStepper.Description;
}

/**
 * A sequence of steps: each `Stepper.Step` holds a `Stepper.Rail` with an `Indicator` and a `Separator`, and a
 * `Stepper.Content` with `Title` and `Description`. Name the list for screen readers with `label`.
 */
export const Stepper: typeof StepperRoot & StepperParts = Object.assign(StepperRoot, {
  Step: HeroStepper.Step,
  Rail: HeroStepper.Rail,
  Indicator: HeroStepper.Indicator,
  IndicatorCheck: HeroStepper.IndicatorCheck,
  IndicatorNumber: HeroStepper.IndicatorNumber,
  Separator: HeroStepper.Separator,
  SeparatorTrack: HeroStepper.SeparatorTrack,
  SeparatorFill: HeroStepper.SeparatorFill,
  Content: HeroStepper.Content,
  Title: HeroStepper.Title,
  Description: HeroStepper.Description,
});

export { useStepper, useStepperAnimation, useStepperStep } from "heroui-native-pro/stepper";
