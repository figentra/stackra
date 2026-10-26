/**
 * Stackra file contract:
 * Purpose: `SegmentProps`, props of the web Segment: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { SegmentProps as HeroSegmentProps } from "@heroui-pro/react/segment";

import type { SegmentContractProps } from "#contracts/types/segment-contract-props.type";
import type { SegmentLabelContractProps } from "#contracts/types/segment-label-contract-props.type";

/** Props of the web Segment: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SegmentProps = SegmentContractProps &
  SegmentLabelContractProps &
  Omit<
    HeroSegmentProps,
    keyof SegmentContractProps | keyof SegmentLabelContractProps | "aria-label"
  >;
