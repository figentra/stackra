/**
 * Stackra file contract:
 * Purpose: the props the native `ProgressButton` takes from the shared vocabulary: the accessible name (`label`) and
 *          the disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop is HeroUI Native Pro's
 *          own and passes through unchanged. Its colour-scheme `variant` is the shared `tone`.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-008.
 */
import type { Tone } from "@stackra/ui/contracts";

/** Props of the native `ProgressButton` that the Stackra vocabulary names. */
export interface ProgressButtonContractProps {
  /** The colour role; HeroUI Native Pro's colour-scheme `variant`, which has no `warning`. Defaults to `default`. */
  readonly tone?: Exclude<Tone, "warning"> | undefined;
  /** The accessible name, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to refuse the hold gesture and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
}
