/**
 * Stackra file contract:
 * Purpose: `StepperStep`, one step of a Stepper: its name, an optional line under it, an optional icon for its marker
 *          and, when the caller knows better than the current step's position, its status.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29).
 */
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { StepperStepStatus } from "#contracts/types/stepper-step-status.type";

/** One step. */
export interface StepperStep {
  /** Unique within the stepper. */
  readonly id: string;
  /** The step's name, for example "Pricing". */
  readonly label: string;
  /** A short line under the name. */
  readonly description?: string | undefined;
  /** The marker's icon, shown with `marker="icon"`; a complete step shows a check either way. */
  readonly icon?: IconSlot | undefined;
  /** Left out, it follows `currentStep`: steps before it complete, after it upcoming. */
  readonly status?: StepperStepStatus | undefined;
}
