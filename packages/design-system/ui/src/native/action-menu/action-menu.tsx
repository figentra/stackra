/**
 * Stackra file contract:
 * Purpose: the native `ActionMenu`: the "more actions" pattern, an `IconButton` that opens a `Menu` of grouped actions
 *          (icons, danger tone, disabled items with their reason), as the contract's `label`, `icon`, `variant`, `size`,
 *          `isDisabled`, `sections`, `placement`, `align`, `onAction` and open state. Every other Menu prop passes
 *          through.
 * Boundary: builds on `#native/menu/menu` and `#native/icon-button/icon-button`; adds no behaviour of its own. It opens
 *           at the button's reading end by default, because it sits at the end of a row. A touch inside the menu never
 *           reaches the row behind it (native touches do not bubble through a portal), so unlike web it stops nothing.
 *           It has no selection, and shortcut hints are left out as in the Menu.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; owner decision 6 of STA-350 (thin wrappers).
 */
import type { ActionMenuContractProps } from "#contracts/types/action-menu-contract-props.type";
import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";
import { IconButton } from "#native/icon-button/icon-button";
import { Menu, type MenuProps } from "#native/menu/menu";

/**
 * Props of the native ActionMenu: the shared contract plus the Menu's own pass-through props. The trigger and the
 * selection belong to the component, so the type refuses them.
 */
export type ActionMenuProps = ActionMenuContractProps &
  Omit<
    MenuProps,
    | keyof ActionMenuContractProps
    | keyof MenuContractProps
    | "children"
    | "selectionMode"
    | "value"
    | "defaultValue"
    | "onChange"
  >;

/**
 * A button that opens a menu of grouped actions, for the end of a row or the corner of a section. `label` names the
 * button.
 */
export function ActionMenu({
  label,
  icon = "ellipsis",
  variant = "ghost",
  size,
  isDisabled,
  placement = "bottom",
  align = "end",
  ...rest
}: ActionMenuProps) {
  return (
    <Menu {...rest} placement={placement} align={align}>
      <IconButton icon={icon} label={label} variant={variant} size={size} isDisabled={isDisabled} />
    </Menu>
  );
}
