/**
 * Stackra file contract:
 * Purpose: `PropertyListProps`, the props of the native `PropertyList` in `property-list.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); WCAG 2.2 SC 1.3.1 and
 *          2.5.8.
 */
import type { ViewProps } from "react-native";
import type { PropertyListContractProps } from "#contracts/types/property-list-contract-props.type";
import type { PropertyListItem } from "#contracts/types/property-list-item.type";

/** Props of the native PropertyList: the shared contract plus the props of a `View`, passed through unchanged. */
export type PropertyListProps<TItem extends PropertyListItem = PropertyListItem> =
  PropertyListContractProps<TItem> & Omit<ViewProps, keyof PropertyListContractProps | "children">;
