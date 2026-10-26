/**
 * Stackra file contract:
 * Purpose: `SegmentProps`, props of the native Segment: the shared contract plus HeroUI Native Pro's own, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { Segment as HeroSegment } from "heroui-native-pro/segment";
import type { ComponentPropsWithRef } from "react";

import type { SegmentContractProps } from "#contracts/types/segment-contract-props.type";

/** Props of the native Segment: the shared contract plus HeroUI Native Pro's own, passed through unchanged. */
export type SegmentProps = SegmentContractProps &
  Omit<ComponentPropsWithRef<typeof HeroSegment>, keyof SegmentContractProps>;
