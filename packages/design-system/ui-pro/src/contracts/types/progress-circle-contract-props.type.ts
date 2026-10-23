/**
 * Stackra file contract:
 * Purpose: the props the native `ProgressCircle` takes from the shared vocabulary: the colour role (`tone`) and the
 *          accessible name (`label`). Every other prop is HeroUI Native Pro's own and passes through unchanged.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { Tone } from "@stackra/ui/contracts";

/** Props of the native `ProgressCircle` root that the Stackra vocabulary names. */
export interface ProgressCircleContractProps {
  /** The colour role of the arc; HeroUI Native Pro's `color`. Defaults to `accent`. */
  readonly tone?: Tone | undefined;
  /** The accessible name of the circle, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
}
