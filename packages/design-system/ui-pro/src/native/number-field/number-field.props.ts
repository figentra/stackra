/**
 * Stackra file contract:
 * Purpose: `NumberFieldProps`, props of the native NumberField: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-012.
 */
import type { NumberField as HeroNumberField } from "heroui-native-pro/number-field";
import type { ComponentPropsWithRef } from "react";

import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";

/**
 * Props of the native NumberField: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type NumberFieldProps = NumberFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroNumberField>,
    keyof NumberFieldContractProps | "accessibilityLabel" | "aria-label"
  >;
