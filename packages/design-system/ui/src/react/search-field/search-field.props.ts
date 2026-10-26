/**
 * Stackra file contract:
 * Purpose: `SearchFieldProps`, the props of the web `SearchField` in `search-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0055; ADR 0165 (HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers).
 */
import type { SearchFieldRootProps } from "@heroui/react";
import type { SearchFieldContractProps } from "#contracts/types/search-field-contract-props.type";

/**
 * Props of the web SearchField: the shared contract plus HeroUI v3's own search field props, passed through
 * unchanged. HeroUI's `fullWidth` is the contract's `isFullWidth`, its `placeholder` belongs to the input, and its
 * children are composed here.
 */
export type SearchFieldProps = SearchFieldContractProps &
  Omit<SearchFieldRootProps, keyof SearchFieldContractProps | "fullWidth" | "children">;
