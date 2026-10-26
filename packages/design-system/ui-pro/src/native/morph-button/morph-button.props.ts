/**
 * Stackra file contract:
 * Purpose: `MorphButtonProps`, props of the native MorphButton: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import type { MorphButton as HeroMorphButton } from "heroui-native-pro/morph-button";
import type { ComponentPropsWithRef } from "react";

import type { MorphButtonContractProps } from "#contracts/types/morph-button-contract-props.type";

/**
 * Props of the native MorphButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type MorphButtonProps = MorphButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroMorphButton>,
    keyof MorphButtonContractProps | "accessibilityLabel" | "aria-label"
  >;
