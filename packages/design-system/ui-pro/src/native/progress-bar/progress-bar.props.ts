/**
 * Stackra file contract:
 * Purpose: `ProgressBarProps`, props of the native ProgressBar: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { ProgressBar as HeroProgressBar } from "heroui-native-pro/progress-bar";
import type { ComponentPropsWithRef } from "react";

import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";

/**
 * Props of the native ProgressBar: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The colour role is `tone` and the accessible name is `label`, so HeroUI's names for them are left out of the type.
 */
export type ProgressBarProps = ProgressBarContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroProgressBar>,
    keyof ProgressBarContractProps | "color" | "accessibilityLabel" | "aria-label"
  >;
