/**
 * Stackra file contract:
 * Purpose: `SwipeableTabsListProps`, props of `SwipeableTabs.List`: the shared contract plus HeroUI Native Pro's own,
 *          with `accessibilityLabel` renamed `label`.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { SwipeableTabs as HeroSwipeableTabs } from "heroui-native-pro/swipeable-tabs";
import type { ComponentPropsWithRef } from "react";

import type { SwipeableTabsListContractProps } from "#contracts/types/swipeable-tabs-contract-props.type";

/**
 * Props of `SwipeableTabs.List`: the shared contract plus HeroUI Native Pro's own, with `accessibilityLabel` renamed
 * `label`.
 */
export type SwipeableTabsListProps = SwipeableTabsListContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSwipeableTabs.List>,
    keyof SwipeableTabsListContractProps | "accessibilityLabel" | "aria-label"
  >;
