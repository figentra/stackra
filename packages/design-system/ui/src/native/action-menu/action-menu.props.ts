/**
 * Stackra file contract:
 * Purpose: `ActionMenuProps`, the props of the native `ActionMenu` in `action-menu.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import type { ActionMenuContractProps } from "#contracts/types/action-menu-contract-props.type";
import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";
import type { MenuProps } from "#native/menu/menu.props";

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
