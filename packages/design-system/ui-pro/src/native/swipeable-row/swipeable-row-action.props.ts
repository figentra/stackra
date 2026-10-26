/**
 * Stackra file contract:
 * Purpose: `SwipeableRowActionProps`, props of `SwipeableRow.Action`: the shared contract plus HeroUI Native Pro's own
 *          action props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-010.
 */
import type { SwipeableRow as HeroSwipeableRow } from "heroui-native-pro/swipeable-row";
import type { ComponentPropsWithRef } from "react";

import type { SwipeableRowActionContractProps } from "#contracts/types/swipeable-row-action-contract-props.type";

/**
 * Props of `SwipeableRow.Action`: the shared contract plus HeroUI Native Pro's own action props, passed through
 * unchanged. The colour scheme is `tone`, so HeroUI's `variant` is left out of the type.
 */
export type SwipeableRowActionProps = SwipeableRowActionContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSwipeableRow.Action>,
    keyof SwipeableRowActionContractProps | "variant"
  >;
