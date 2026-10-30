/**
 * Stackra file contract:
 * Purpose: `StepperState`, a Stepper step with its resolved status and whether it can be pressed.
 * Boundary: types only; internal to the web and native Stepper.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { StepperStep } from "#contracts/types/stepper-step.type";
import type { StepperStepStatus } from "#contracts/types/stepper-step-status.type";

/** A step with its resolved status and whether it can be pressed. */
export interface StepperState {
  /** The step as the caller gave it. */
  readonly step: StepperStep;
  /** The status worked out from the current step. */
  readonly status: StepperStepStatus;
  /** True when pressing the step moves to it. */
  readonly isPressable: boolean;
}
