/**
 * Stackra file contract:
 * Purpose: `EntityPickerProps`, the props of the web `EntityPicker` in `entity-picker.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318 (wave 7
 *          vocabulary); ADR 0055 (one field contract); ADR 0165 (UI contract, HeroUI v3 on web); WCAG 2.2 SC 1.3.1,
 *          2.1.1, 4.1.2, 4.1.3.
 */
import type { ComboBoxRootProps } from "@heroui/react";
import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityPickerContractProps } from "#contracts/types/entity-picker-contract-props.type";
import type { EntityPickerBaseContractProps } from "#contracts/types/entity-picker-base-contract-props.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/**
 * Props of the web EntityPicker: the shared contract (single or multiple, told apart by `selectionMode`) plus HeroUI
 * v3's own combo box props, passed through unchanged. The picker owns the list, the typed text and the selection, so
 * HeroUI's names for them are refused.
 */
export type EntityPickerProps = EntityPickerContractProps &
  Omit<
    ComboBoxRootProps<EntityOption>,
    | keyof EntityPickerBaseContractProps
    | keyof FieldContractProps<unknown>
    | "selectionMode"
    | "removeLabel"
    | "children"
    | "items"
    | "defaultItems"
    | "fullWidth"
    | "defaultFilter"
    | "inputValue"
    | "defaultInputValue"
    | "onInputChange"
    | "formValue"
    | "allowsCustomValue"
    | "allowsEmptyCollection"
  >;
