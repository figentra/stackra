/**
 * Stackra file contract:
 * Purpose: `WheelDateTimePickerProps`, props of the native WheelDateTimePicker: the shared contract plus HeroUI Native
 *          Pro's own props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-009.
 */
import type { WheelDateTimePicker as HeroWheelDateTimePicker } from "heroui-native-pro/wheel-date-time-picker";
import type { ComponentPropsWithRef } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";

/**
 * Props of the native WheelDateTimePicker: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type WheelDateTimePickerProps = DatePickerContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroWheelDateTimePicker>,
    keyof DatePickerContractProps | "accessibilityLabel" | "aria-label"
  >;
