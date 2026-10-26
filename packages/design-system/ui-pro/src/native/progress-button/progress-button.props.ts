/**
 * Stackra file contract:
 * Purpose: `ProgressButtonProps`, props of the native ProgressButton: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-008.
 */
import type { ProgressButton as HeroProgressButton } from "heroui-native-pro/progress-button";
import type { ComponentPropsWithRef } from "react";

import type { ProgressButtonContractProps } from "#contracts/types/progress-button-contract-props.type";

/**
 * Props of the native ProgressButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label` and the colour scheme is `tone`, so HeroUI's names for them are left out.
 */
export type ProgressButtonProps = ProgressButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroProgressButton>,
    keyof ProgressButtonContractProps | "variant" | "accessibilityLabel" | "aria-label"
  >;
