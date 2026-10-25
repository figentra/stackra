/**
 * Stackra file contract:
 * Purpose: the props the web and native `Carousel` take from the shared vocabulary: the accessible name (`label`).
 *          Every other prop is HeroUI Pro's own and passes through unchanged.
 * Boundary: types only; shared by `@stackra-pro/ui/react` and `@stackra-pro/ui/native`.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005 and FR-008.
 */

/** Props of the `Carousel` root that the Stackra vocabulary names. */
export interface CarouselContractProps {
  /** The accessible name of the carousel, read by screen readers; `aria-label` on web, `accessibilityLabel` on native. */
  readonly label?: string | undefined;
}
