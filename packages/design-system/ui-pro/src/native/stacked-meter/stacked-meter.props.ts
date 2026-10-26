/**
 * Stackra file contract:
 * Purpose: `StackedMeterProps`, props of the native StackedMeter: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import type { StackedMeter as HeroStackedMeter } from "heroui-native-pro/stacked-meter";
import type { ComponentPropsWithRef } from "react";

import type { StackedMeterContractProps } from "#contracts/types/stacked-meter-contract-props.type";

/**
 * Props of the native StackedMeter: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's spelling of it is left out of the type.
 */
export type StackedMeterProps = StackedMeterContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroStackedMeter>,
    keyof StackedMeterContractProps | "accessibilityLabel" | "aria-label"
  >;
