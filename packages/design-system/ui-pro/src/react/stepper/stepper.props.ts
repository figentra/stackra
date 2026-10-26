/**
 * Stackra file contract:
 * Purpose: `StepperProps`, props of the web Stepper: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { StepperProps as HeroStepperProps } from "@heroui-pro/react/stepper";

import type { StepperWebContractProps } from "#contracts/types/stepper-web-contract-props.type";

/** Props of the web Stepper: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type StepperProps = StepperWebContractProps &
  Omit<HeroStepperProps, keyof StepperWebContractProps | "aria-label">;
