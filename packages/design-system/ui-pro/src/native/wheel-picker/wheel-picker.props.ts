/**
 * Stackra file contract:
 * Purpose: `WheelPickerProps`, props of the native WheelPicker: the shared contract plus HeroUI Native Pro's own,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import type {
  WheelPicker as HeroWheelPicker,
  WheelPickerRootProps as HeroWheelPickerRootProps,
} from "heroui-native-pro/wheel-picker";
import type { ComponentProps } from "react";

import type { WheelPickerContractProps } from "#contracts/types/wheel-picker-contract-props.type";

/**
 * Props of the native WheelPicker: the shared contract plus HeroUI Native Pro's own, passed through unchanged. The
 * accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type WheelPickerProps<T = unknown> = WheelPickerContractProps &
  Omit<
    HeroWheelPickerRootProps<T>,
    keyof WheelPickerContractProps | "accessibilityLabel" | "aria-label"
  > & { readonly ref?: ComponentProps<typeof HeroWheelPicker>["ref"] };
