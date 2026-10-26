/**
 * Stackra file contract:
 * Purpose: `SearchFieldProps`, the props of the native `SearchField` in `search-field.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0055; ADR 0165 (HeroUI Native on native); owner decision 6 of STA-350 (thin wrappers).
 */
import type { SearchField as HeroSearchField } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { SearchFieldContractProps } from "#contracts/types/search-field-contract-props.type";

/**
 * Props of the native SearchField: the shared contract plus HeroUI Native's own search field props, passed through
 * unchanged to its root. `children` are composed here, and `value`, `onChange` and the states are the contract's.
 */
export type SearchFieldProps = SearchFieldContractProps &
  Omit<ComponentPropsWithRef<typeof HeroSearchField>, keyof SearchFieldContractProps | "children">;
