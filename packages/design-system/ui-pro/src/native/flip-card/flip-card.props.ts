/**
 * Stackra file contract:
 * Purpose: `FlipCardProps`, props of the native FlipCard: the shared contract plus HeroUI Native Pro's own props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { FlipCard as HeroFlipCard } from "heroui-native-pro/flip-card";
import type { ComponentPropsWithRef } from "react";

import type { FlipCardContractProps } from "#contracts/types/flip-card-contract-props.type";

/**
 * Props of the native FlipCard: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type FlipCardProps = FlipCardContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroFlipCard>,
    keyof FlipCardContractProps | "accessibilityLabel" | "aria-label"
  >;
