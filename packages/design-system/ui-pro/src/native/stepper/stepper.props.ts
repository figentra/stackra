/**
 * Stackra file contract:
 * Purpose: `StepperProps`, props of the native Stepper: the shared contract plus HeroUI Native Pro's own, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { Stepper as HeroStepper } from "heroui-native-pro/stepper";
import type { ComponentPropsWithRef } from "react";

import type { StepperContractProps } from "#contracts/types/stepper-contract-props.type";

/**
 * Props of the native Stepper: the shared contract plus HeroUI Native Pro's own, passed through unchanged. The
 * accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type StepperProps = StepperContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroStepper>,
    keyof StepperContractProps | "accessibilityLabel" | "aria-label"
  >;
