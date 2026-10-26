/**
 * Stackra file contract:
 * Purpose: `FieldErrorProps`, the props of the native `FieldError` in `field-error.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0055 (forms); ADR 0303.
 */
import type { FieldError as HeroFieldError } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { FieldErrorContractProps } from "#contracts/types/field-error-contract-props.type";

/** Props of the native FieldError: the shared contract plus HeroUI Native's own props, passed through unchanged. */
export type FieldErrorProps = FieldErrorContractProps &
  Omit<ComponentPropsWithRef<typeof HeroFieldError>, keyof FieldErrorContractProps>;
