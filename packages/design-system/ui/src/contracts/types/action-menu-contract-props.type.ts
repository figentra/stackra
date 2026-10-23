/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ActionMenu` takes: the "more actions" button (its accessible name, icon, size and
 *          variant) with the sections of actions it opens, the open state and placement every overlay shares, and the
 *          handler for every action chosen. Each runtime's `ActionMenuProps` is this plus its Menu's own props, which
 *          pass through unchanged.
 * Boundary: types only. No selection: it is a menu of actions, and a menu that keeps a choice is a `Menu`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0312 (decision 4);
 *          ADR 0165 (UI contract).
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `ActionMenu`. */
export interface ActionMenuContractProps extends OpenStateContractProps, PlacementContractProps {
  /** The accessible name of the button, read in place of its icon, for example "Actions for order 1001". */
  readonly label: string;
  /** The groups of actions, in order, with a divider between them. */
  readonly sections: readonly MenuSection[];
  /** The icon of the button: an icon name or any icon element. Defaults to `ellipsis`, which the app registers. */
  readonly icon?: IconSlot | undefined;
  /** The emphasis of the button. Defaults to `ghost`, which sits quietly in a row. */
  readonly variant?: ButtonVariant | undefined;
  /** The size of the button. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to refuse opening the menu; the button shows the disabled style. */
  readonly isDisabled?: boolean | undefined;
  /** Called with the key of every action chosen, after the action's own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
}
