/**
 * Stackra file contract:
 * Purpose: `PhoneNumberFieldProps`, props of the native PhoneNumberField: the shared contract plus HeroUI Native Pro's
 *          own, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import type { PhoneNumberField as HeroPhoneNumberField } from "heroui-native-pro/phone-number-field";
import type { ComponentPropsWithRef } from "react";

import type { PhoneNumberFieldContractProps } from "#contracts/types/phone-number-field-contract-props.type";

/**
 * Props of the native PhoneNumberField: the shared contract plus HeroUI Native Pro's own, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type PhoneNumberFieldProps = PhoneNumberFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroPhoneNumberField>,
    keyof PhoneNumberFieldContractProps | "accessibilityLabel" | "aria-label"
  >;
