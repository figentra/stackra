/**
 * Stackra file contract:
 * Purpose: `SegmentLabelContractProps`, the accessible name of the segmented control, taken by the web `Segment` root
 *          and the native `Segment.Group`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004 and
 *                     FR-011.
 */

/** The accessible name of the segmented control, taken by the web `Segment` root and the native `Segment.Group`. */
export interface SegmentLabelContractProps {
  /** The accessible name of the control; HeroUI Pro's `aria-label`, HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
}
