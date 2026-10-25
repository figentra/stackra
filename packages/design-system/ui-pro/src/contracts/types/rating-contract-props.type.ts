/**
 * Stackra file contract:
 * Purpose: the props the web and native `Rating` take from the shared vocabulary: the accessible name (`label`).
 *          Every other prop is HeroUI Pro's own and passes through unchanged.
 * Boundary: types only; shared by `@stackra-pro/ui/react` and `@stackra-pro/ui/native`.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005 and FR-008.
 */

/** Props of the `Rating` root that the Stackra vocabulary names. */
export interface RatingContractProps {
  /**
   * The accessible name of the rating, which is a radio group; `aria-label` on web, `accessibilityLabel` on native.
   * Required because a radio group with no name cannot be understood by a screen reader.
   */
  readonly label: string;
}
