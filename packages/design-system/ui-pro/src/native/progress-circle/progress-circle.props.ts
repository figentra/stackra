/**
 * Stackra file contract:
 * Purpose: `ProgressCircleProps`, props of the native ProgressCircle: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { ProgressCircle as HeroProgressCircle } from "heroui-native-pro/progress-circle";
import type { ComponentPropsWithRef } from "react";

import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";

/**
 * Props of the native ProgressCircle: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The colour role is `tone` and the accessible name is `label`, so HeroUI's names for them are left out
 * of the type.
 */
export type ProgressCircleProps = ProgressCircleContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroProgressCircle>,
    keyof ProgressCircleContractProps | "color" | "accessibilityLabel" | "aria-label"
  >;
