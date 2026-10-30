/**
 * Stackra file contract:
 * Purpose: `stepperStatesOf(steps, currentStep, canPress, isLinear)`, each Stepper step's status (its own, or by its
 *          place against the current step) and whether it can be pressed, shared by the web and native Stepper.
 * Boundary: pure; an unknown `currentStep` reads as before the first step, so every step is upcoming.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29).
 */
import type { StepperStep } from "#contracts/types/stepper-step.type";
import type { StepperStepStatus } from "#contracts/types/stepper-step-status.type";
import type { StepperState } from "#core/types/stepper-state.type";

/** The steps with their statuses. */
export function stepperStatesOf(
  steps: readonly StepperStep[],
  currentStep: string,
  canPress: boolean,
  isLinear: boolean,
): readonly StepperState[] {
  const at = steps.findIndex((step) => step.id === currentStep);
  return steps.map((step, index) => {
    const status: StepperStepStatus =
      step.status ?? (index < at ? "complete" : index === at ? "current" : "upcoming");
    const isPressable =
      canPress && status !== "current" && (isLinear ? status === "complete" : true);
    return { step, status, isPressable };
  });
}
