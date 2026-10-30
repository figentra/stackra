/**
 * Stackra file contract:
 * Purpose: `StepperProps`, the props of the web `Stepper`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { StepperContractProps } from "#contracts/types/stepper-contract-props.type";

/** Props of the web Stepper. */
export type StepperProps = StepperContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
