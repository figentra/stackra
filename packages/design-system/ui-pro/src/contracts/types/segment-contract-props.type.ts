/**
 * Stackra file contract:
 * Purpose: the props the `Segment` compound takes from the shared vocabulary on both platforms: the shared `size`, the disabled state and the accessible name of the segmented control.
 * Boundary: types only; web and native share it. The web root and the native `Segment.Group` (the tablist) take the name; every other prop is HeroUI's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004 and FR-011.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the `Segment` root, web and native, that the Stackra vocabulary names. */
export interface SegmentContractProps {
  /** The size of the control; HeroUI's own default when left out. */
  readonly size?: Size | undefined;
  /** True to disable every item. */
  readonly isDisabled?: boolean | undefined;
}
