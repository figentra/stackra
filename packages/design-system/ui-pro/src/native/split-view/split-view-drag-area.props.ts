/**
 * Stackra file contract:
 * Purpose: `SplitViewDragAreaProps`, props of `SplitView.DragArea`: the shared contract plus HeroUI Native Pro's own,
 *          with `accessibilityLabel` renamed `label`.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { SplitView as HeroSplitView } from "heroui-native-pro/split-view";
import type { ComponentPropsWithRef } from "react";

import type { SplitViewDragAreaContractProps } from "#contracts/types/split-view-contract-props.type";

/**
 * Props of `SplitView.DragArea`: the shared contract plus HeroUI Native Pro's own, with `accessibilityLabel` renamed
 * `label`.
 */
export type SplitViewDragAreaProps = SplitViewDragAreaContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSplitView.DragArea>,
    keyof SplitViewDragAreaContractProps | "accessibilityLabel" | "aria-label"
  >;
