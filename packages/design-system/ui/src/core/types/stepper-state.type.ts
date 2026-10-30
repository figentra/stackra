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
  readonly step: StepperStep;
  readonly status: StepperStepStatus;
  readonly isPressable: boolean;
}
