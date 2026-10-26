/**
 * Stackra file contract:
 * Purpose: `ComboBoxProps`, the props of the web `ComboBox` in `combo-box.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0055 (one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ComboBoxRootProps } from "@heroui/react";
import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/**
 * Props of the web ComboBox: the shared contract plus HeroUI v3's own combo box props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`; the app lists choices as `items`, never as children.
 */
export type ComboBoxProps = ComboBoxContractProps &
  Omit<
    ComboBoxRootProps<SelectItem>,
    keyof ComboBoxContractProps | "children" | "items" | "fullWidth" | "defaultFilter"
  >;
