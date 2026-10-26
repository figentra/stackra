/**
 * Stackra file contract:
 * Purpose: `SegmentGroupProps`, props of `Segment.Group`: the shared name plus HeroUI Native Pro's own, with
 *          `accessibilityLabel` renamed `label`.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { Segment as HeroSegment } from "heroui-native-pro/segment";
import type { ComponentPropsWithRef } from "react";

import type { SegmentLabelContractProps } from "#contracts/types/segment-label-contract-props.type";

/** Props of `Segment.Group`: the shared name plus HeroUI Native Pro's own, with `accessibilityLabel` renamed `label`. */
export type SegmentGroupProps = SegmentLabelContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSegment.Group>,
    keyof SegmentLabelContractProps | "accessibilityLabel" | "aria-label"
  >;
