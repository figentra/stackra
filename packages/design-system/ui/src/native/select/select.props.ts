/**
 * Stackra file contract:
 * Purpose: `SelectProps`, the props of the native `Select` in `select.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0055 (one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import type { SelectRootProps } from "heroui-native";
import type { SelectContractProps } from "#contracts/types/select-contract-props.type";

/**
 * Props of the native Select: the shared contract plus HeroUI Native's own select props, passed through unchanged.
 * HeroUI's `value`, `defaultValue` and `onValueChange` are the contract's `value`, `defaultValue` and `onChange`, in
 * keys instead of options; the app lists choices as `items`, never as children, and the selection is always one.
 */
export type SelectProps = SelectContractProps &
  Omit<
    SelectRootProps,
    | keyof SelectContractProps
    | "children"
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "selectionMode"
  >;
