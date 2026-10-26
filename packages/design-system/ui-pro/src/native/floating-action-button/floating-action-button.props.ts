/**
 * Stackra file contract:
 * Purpose: `FloatingActionButtonProps`, props of the native FloatingActionButton: the shared contract plus HeroUI
 *          Native Pro's own props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import type { FAB as HeroFab } from "heroui-native-pro/fab";
import type { ComponentPropsWithRef } from "react";

import type { FloatingActionButtonContractProps } from "#contracts/types/floating-action-button-contract-props.type";

/**
 * Props of the native FloatingActionButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type FloatingActionButtonProps = FloatingActionButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroFab>,
    keyof FloatingActionButtonContractProps | "accessibilityLabel" | "aria-label"
  >;
