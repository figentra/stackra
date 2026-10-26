/**
 * Stackra file contract:
 * Purpose: `WheelPickerGroupProps`, props of the native WheelPickerGroup: the shared contract plus HeroUI Native Pro's
 *          own, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import type { WheelPickerGroup as HeroWheelPickerGroup } from "heroui-native-pro/wheel-picker-group";
import type { ComponentPropsWithRef } from "react";

import type { WheelPickerGroupContractProps } from "#contracts/types/wheel-picker-group-contract-props.type";

/**
 * Props of the native WheelPickerGroup: the shared contract plus HeroUI Native Pro's own, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type WheelPickerGroupProps = WheelPickerGroupContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroWheelPickerGroup>,
    keyof WheelPickerGroupContractProps | "accessibilityLabel" | "aria-label"
  >;
