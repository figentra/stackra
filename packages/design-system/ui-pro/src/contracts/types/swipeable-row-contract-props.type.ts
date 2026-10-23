/**
 * Stackra file contract:
 * Purpose: the props the native `SwipeableRow` and its `Action` part take from the shared vocabulary: on the row the
 *          accessible name (`label`) and the disabled state (`isDisabled`, HeroUI Native Pro's own name), on the
 *          action the colour role (`tone`). Every other prop is HeroUI Native Pro's own and passes through
 *          unchanged, the row's layout `variant` (`standalone` or `inline`) and the imperative ref included.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-010.
 */
import type { Tone } from "@stackra/ui/contracts";

/** Props of the native `SwipeableRow` that the Stackra vocabulary names. */
export interface SwipeableRowContractProps {
  /** The accessible name of the row, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to refuse the swipe gesture. */
  readonly isDisabled?: boolean | undefined;
}

/** Props of `SwipeableRow.Action` that the Stackra vocabulary names. */
export interface SwipeableRowActionContractProps {
  /** The colour role; HeroUI Native Pro's colour-scheme `variant`, which has no `warning`. Defaults to `default`. */
  readonly tone?: Exclude<Tone, "warning"> | undefined;
}
