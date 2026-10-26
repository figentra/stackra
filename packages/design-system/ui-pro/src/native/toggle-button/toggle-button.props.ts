/**
 * Stackra file contract:
 * Purpose: `ToggleButtonProps`, props of the native ToggleButton: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import type { ToggleButton as HeroToggleButton } from "heroui-native-pro/toggle-button";
import type { ComponentPropsWithRef } from "react";

import type { ToggleButtonContractProps } from "#contracts/types/toggle-button-contract-props.type";

/**
 * Props of the native ToggleButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type ToggleButtonProps = ToggleButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroToggleButton>,
    keyof ToggleButtonContractProps | "accessibilityLabel" | "aria-label"
  >;
