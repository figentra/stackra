/**
 * Stackra file contract:
 * Purpose: `StepperContractProps`, the props every runtime's `Stepper` takes: the steps of a multi-step task, the one in
 *          hand, horizontal or vertical, numbered or icon markers, and a compact "Step 2 of 4" with dots.
 * Boundary: types only; which step is current is the caller's state.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (owner request 2026-10-29).
 */
import type { StepperStep } from "#contracts/types/stepper-step.type";

/** Props shared by the web and native `Stepper`. */
export interface StepperContractProps {
  /** The steps, in order. */
  readonly steps: readonly StepperStep[];
  /** The id of the step in hand; earlier steps read as complete, later ones as upcoming. */
  readonly currentStep: string;
  /** `horizontal` (a row with connectors between) or `vertical` (a column). Defaults to `horizontal`. */
  readonly orientation?: "horizontal" | "vertical" | undefined;
  /** `default`, or `compact`: "Step 2 of 4", the current step's name and a dot per step. */
  readonly variant?: "default" | "compact" | undefined;
  /** `number` (1, 2, 3 in the customer's digits) or `icon` (each step's icon). A complete step shows a check. */
  readonly marker?: "number" | "icon" | undefined;
  /** Called with a step's id when it is pressed; left out, the steps are not pressable. */
  readonly onStepPress?: ((id: string) => void) | undefined;
  /** True (the default): only complete steps can be pressed. False: any step but the current one. */
  readonly isLinear?: boolean | undefined;
  /** The list's name, for example "Add a product"; defaults to the catalogue's "Progress". */
  readonly label?: string | undefined;
}
