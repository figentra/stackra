/**
 * Stackra file contract:
 * Purpose: `RadioButtonGroupProps`, props of the native RadioButtonGroup: the shared contract plus HeroUI Native Pro's
 *          own, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import type { RadioButtonGroup as HeroRadioButtonGroup } from "heroui-native-pro/radio-button-group";
import type { ComponentPropsWithRef } from "react";

import type { RadioButtonGroupContractProps } from "#contracts/types/radio-button-group-contract-props.type";

/**
 * Props of the native RadioButtonGroup: the shared contract plus HeroUI Native Pro's own, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type RadioButtonGroupProps = RadioButtonGroupContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroRadioButtonGroup>,
    keyof RadioButtonGroupContractProps | "accessibilityLabel" | "aria-label"
  >;
