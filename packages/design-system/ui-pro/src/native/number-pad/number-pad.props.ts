/**
 * Stackra file contract:
 * Purpose: `NumberPadProps`, props of the native NumberPad: the shared contract plus HeroUI Native Pro's own, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import type { NumberPad as HeroNumberPad } from "heroui-native-pro/number-pad";
import type { ComponentPropsWithRef } from "react";

import type { NumberPadContractProps } from "#contracts/types/number-pad-contract-props.type";

/**
 * Props of the native NumberPad: the shared contract plus HeroUI Native Pro's own, passed through unchanged. The
 * accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type NumberPadProps = NumberPadContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroNumberPad>,
    keyof NumberPadContractProps | "accessibilityLabel" | "aria-label"
  >;
