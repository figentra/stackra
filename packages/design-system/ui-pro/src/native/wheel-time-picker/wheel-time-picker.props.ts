/**
 * Stackra file contract:
 * Purpose: `WheelTimePickerProps`, props of the native WheelTimePicker: the shared contract plus HeroUI Native Pro's
 *          own props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import type { WheelTimePicker as HeroWheelTimePicker } from "heroui-native-pro/wheel-time-picker";
import type { ComponentPropsWithRef } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";

/**
 * Props of the native WheelTimePicker: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type WheelTimePickerProps = DatePickerContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroWheelTimePicker>,
    keyof DatePickerContractProps | "accessibilityLabel" | "aria-label"
  >;
