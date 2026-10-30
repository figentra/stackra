/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SegmentedControl` takes: a few exclusive choices in a pill with a thumb that slides to the chosen one (Day / Week / Month).
 * Boundary: types only. A radio group to assistive technology.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { Size } from "#contracts/enums/size.enum";
import type { SegmentSelectionContractProps } from "#contracts/types/segment-selection-contract-props.type";

/** Props shared by the web and native `SegmentedControl`. */
export interface SegmentedControlContractProps extends SegmentSelectionContractProps {
  /** The height and text size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to stretch to the container, the segments sharing the width. */
  readonly isFullWidth?: boolean | undefined;
}
