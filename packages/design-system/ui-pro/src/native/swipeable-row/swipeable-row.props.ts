/**
 * Stackra file contract:
 * Purpose: `SwipeableRowProps`, props of the native SwipeableRow: the shared contract plus HeroUI Native Pro's own
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-010.
 */
import type { SwipeableRow as HeroSwipeableRow } from "heroui-native-pro/swipeable-row";
import type { ComponentPropsWithRef } from "react";

import type { SwipeableRowContractProps } from "#contracts/types/swipeable-row-contract-props.type";

/**
 * Props of the native SwipeableRow: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type SwipeableRowProps = SwipeableRowContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSwipeableRow>,
    keyof SwipeableRowContractProps | "accessibilityLabel" | "aria-label"
  >;
