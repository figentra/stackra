/**
 * Stackra file contract:
 * Purpose: the props the native `StackedMeter` takes from the shared vocabulary: the accessible name (`label`), the
 *          track `size` and the disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop is
 *          HeroUI Native Pro's own and passes through unchanged, the segments and their colour variants included.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the native `StackedMeter` that the Stackra vocabulary names. */
export interface StackedMeterContractProps {
  /** The accessible name of the meter, prefixed to its spoken summary; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** The size of the track; HeroUI Native Pro's own values, `md` unless set. */
  readonly size?: Size | undefined;
  /** True to lower the opacity and mark the meter as disabled for accessibility. */
  readonly isDisabled?: boolean | undefined;
}
