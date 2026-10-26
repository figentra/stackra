/**
 * Stackra file contract:
 * Purpose: `DatePickerProps`, props of the native DatePicker: the shared contract plus HeroUI Native Pro's own props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-011.
 */
import type { DatePicker as HeroDatePicker } from "heroui-native-pro/date-picker";
import type { ComponentPropsWithRef } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";

/**
 * Props of the native DatePicker: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type DatePickerProps = DatePickerContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroDatePicker>,
    keyof DatePickerContractProps | "accessibilityLabel" | "aria-label"
  >;
