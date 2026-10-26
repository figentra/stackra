/**
 * Stackra file contract:
 * Purpose: `ToggleButtonGroupProps`, props of the native ToggleButtonGroup: the shared contract plus HeroUI Native
 *          Pro's own props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import type { ToggleButtonGroup as HeroToggleButtonGroup } from "heroui-native-pro/toggle-button-group";
import type { ComponentPropsWithRef } from "react";

import type { ToggleButtonGroupContractProps } from "#contracts/types/toggle-button-group-contract-props.type";

/**
 * Props of the native ToggleButtonGroup: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label` and the full-width flag is `isFullWidth`, so HeroUI's names for them are
 * left out of the type.
 */
export type ToggleButtonGroupProps = ToggleButtonGroupContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroToggleButtonGroup>,
    keyof ToggleButtonGroupContractProps | "fullWidth" | "accessibilityLabel" | "aria-label"
  >;
