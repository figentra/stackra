/**
 * Stackra file contract:
 * Purpose: `QuantityStepperProps`, the props of the native `QuantityStepper` in `quantity-stepper.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { QuantityStepperContractProps } from "#contracts/types/quantity-stepper-contract-props.type";

/** Props of the native QuantityStepper: the shared contract plus the root's own props, passed through. */
export type QuantityStepperProps = QuantityStepperContractProps &
  Omit<ViewProps, keyof QuantityStepperContractProps>;
