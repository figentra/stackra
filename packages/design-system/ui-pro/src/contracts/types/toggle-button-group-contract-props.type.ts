/**
 * Stackra file contract:
 * Purpose: the props the native `ToggleButtonGroup` takes from the shared vocabulary: the accessible name (`label`),
 *          the size (`size`), the disabled state (`isDisabled`, HeroUI Native Pro's own name) and the full-width
 *          flag (`isFullWidth`, HeroUI Native Pro's `fullWidth`). Every other prop, `selectionMode`, `selectedKeys`
 *          and `onSelectionChange` included, is HeroUI Native Pro's own and passes through.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the native `ToggleButtonGroup` that the Stackra vocabulary names. */
export interface ToggleButtonGroupContractProps {
  /** The accessible name of the group, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** The size handed to every button in the group; HeroUI Native's own `sm`, `md` and `lg`. */
  readonly size?: Size | undefined;
  /** True to disable every button in the group. */
  readonly isDisabled?: boolean | undefined;
  /** True to make the group fill the width of its parent; HeroUI Native Pro's `fullWidth`. */
  readonly isFullWidth?: boolean | undefined;
}
