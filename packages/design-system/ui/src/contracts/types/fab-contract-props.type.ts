/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Fab` takes: the one main action of a screen as a round floating button (icon, or icon and label when extended), or, with `actions`, a speed dial that fans its related actions out above it.
 * Boundary: types only. The Fab floats in its nearest positioned ancestor unless `placement` is `inline`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { FabPlacement } from "#contracts/enums/fab-placement.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { FabAction } from "#contracts/types/fab-action.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `Fab`. The open state is the speed dial's. */
export interface FabContractProps extends OpenStateContractProps {
  /** The accessible name, also shown beside the icon when `isExtended`, for example "New order". */
  readonly label: string;
  /** The icon. Defaults to `plus`; with `actions` it turns into a close mark while open. */
  readonly icon?: IconSlot | undefined;
  /** True to show the label beside the icon (an extended FAB). */
  readonly isExtended?: boolean | undefined;
  /** Called when the Fab is pressed; without `actions` it is the Fab's action. */
  readonly onPress?: (() => void) | undefined;
  /** The speed dial: related actions that fan out above the Fab when it is pressed. */
  readonly actions?: readonly FabAction[] | undefined;
  /** Called with the id of every speed-dial action chosen, after the action's own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
  /** Where it sits. Defaults to `bottom-end`, the reading end, so bottom left in Arabic. */
  readonly placement?: FabPlacement | undefined;
  /** The emphasis. Defaults to `primary`. */
  readonly variant?: ButtonVariant | undefined;
  /** The size. Defaults to `lg`. */
  readonly size?: Size | undefined;
  /** True to refuse presses. */
  readonly isDisabled?: boolean | undefined;
}
