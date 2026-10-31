/**
 * Stackra file contract:
 * Purpose: `FilterBarProps`, the props of the native `FilterBar` in `filter-bar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318 (decisions 1 to 4 and 10); ADR 0165 (HeroUI Native on native); ADR 0060 (right-to-left); WCAG
 *          2.2 SC 1.3.1, 2.5.8, 4.1.2; owner decision 6 of STA-350 (thin wrappers).
 */
import type { ViewProps } from "react-native";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";

/**
 * Props of the native FilterBar: the shared contract plus the props of a `View`, passed through to the root. The bar
 * draws its own content, so children are refused.
 */
export type FilterBarProps<TItem extends CollectionItem = CollectionItem> =
  FilterBarContractProps<TItem> & Omit<ViewProps, keyof FilterBarContractProps | "children">;
