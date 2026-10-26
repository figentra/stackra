/**
 * Stackra file contract:
 * Purpose: `SlideButtonProps`, props of the native SlideButton: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-009.
 */
import type { SlideButton as HeroSlideButton } from "heroui-native-pro/slide-button";
import type { ComponentPropsWithRef } from "react";

import type { SlideButtonContractProps } from "#contracts/types/slide-button-contract-props.type";

/**
 * Props of the native SlideButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label` and the colour scheme is `tone`, so HeroUI's names for them are left out.
 */
export type SlideButtonProps = SlideButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSlideButton>,
    keyof SlideButtonContractProps | "variant" | "accessibilityLabel" | "aria-label"
  >;
