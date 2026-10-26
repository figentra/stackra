/**
 * Stackra file contract:
 * Purpose: `NumberStepperProps`, props of the web NumberStepper: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { NumberStepperProps as HeroNumberStepperProps } from "@heroui-pro/react/number-stepper";

import type { NumberStepperContractProps } from "#contracts/types/number-stepper-contract-props.type";

/** Props of the web NumberStepper: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type NumberStepperProps = NumberStepperContractProps &
  Omit<HeroNumberStepperProps, keyof NumberStepperContractProps | "aria-label">;
