/**
 * Stackra file contract:
 * Purpose: the props the `Stepper` compound takes from the shared vocabulary: the accessible name of the step list on both platforms, and the shared `size` on web.
 * Boundary: types only; web and native share it. HeroUI Native Pro's stepper has no size, so `size` is in the web-only interface. Every other prop is HeroUI's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004 and FR-011.
 */

/** Props of the `Stepper` root, web and native, that the Stackra vocabulary names. */
export interface StepperContractProps {
  /** The accessible name of the step list; HeroUI Pro's `aria-label`, HeroUI Native Pro's `accessibilityLabel`. HeroUI Pro names it "Progress" when left out. */
  readonly label?: string | undefined;
}
