/**
 * Stackra file contract:
 * Purpose: `QuantityStepperProps`, the props of the web `QuantityStepper` in `quantity-stepper.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { QuantityStepperContractProps } from "#contracts/types/quantity-stepper-contract-props.type";

/** Props of the web QuantityStepper: the shared contract plus the root's own props, passed through. */
export type QuantityStepperProps = QuantityStepperContractProps &
  Omit<
    ComponentPropsWithoutRef<"div">,
    keyof QuantityStepperContractProps | "children" | "onChange" | "defaultValue"
  >;
