/**
 * Stackra file contract:
 * Purpose: the props the native `FlipCard` takes from the shared vocabulary: the accessible name (`label`). Every
 *          other prop is HeroUI Native Pro's own and passes through unchanged.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */

/** Props of the native `FlipCard` root that the Stackra vocabulary names. */
export interface FlipCardContractProps {
  /** The accessible name of the card, which is a pressable; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
}
