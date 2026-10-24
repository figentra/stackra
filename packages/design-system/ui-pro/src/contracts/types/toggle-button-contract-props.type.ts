/**
 * Stackra file contract:
 * Purpose: the props the native `ToggleButton` takes from the shared vocabulary: the accessible name (`label`), the
 *          size (`size`) and the disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop,
 *          `isSelected`, `defaultSelected`, `onChange` and `variant` included, is HeroUI Native Pro's own.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the native `ToggleButton` that the Stackra vocabulary names. */
export interface ToggleButtonContractProps {
  /** The accessible name of the button, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** The size of the button; HeroUI Native's own `sm`, `md` and `lg`. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to refuse the press and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
}
