/**
 * Stackra file contract:
 * Purpose: `MultiSelectProps`, the props of the web `MultiSelect` in `multi-select.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); gap inventory row 4.
 */
import type { ComboBoxRootProps } from "@heroui/react";
import type { MultiSelectContractProps } from "#contracts/types/multi-select-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/**
 * Props of the web MultiSelect: the shared contract plus HeroUI v3's ComboBox root props, passed through. The field
 * owns the selection, the typed text and the list, so those props are refused.
 */
export type MultiSelectProps = MultiSelectContractProps &
  Omit<
    ComboBoxRootProps<SelectItem, "multiple">,
    | keyof MultiSelectContractProps
    | "children"
    | "selectionMode"
    | "inputValue"
    | "defaultInputValue"
    | "onInputChange"
    | "fullWidth"
    | "defaultItems"
  >;
