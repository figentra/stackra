/**
 * Stackra file contract:
 * Purpose: `PropertyListProps`, the props of the web `PropertyList` in `property-list.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (decisions 1 and 7); WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.3.
 */
import type { ComponentPropsWithoutRef } from "react";
import type { PropertyListContractProps } from "#contracts/types/property-list-contract-props.type";
import type { PropertyListItem } from "#contracts/types/property-list-item.type";

/**
 * Props of the web PropertyList: the shared contract plus the attributes of a `dl`, passed through. The rows are drawn
 * from `items`, so `children` is refused.
 */
export type PropertyListProps<TItem extends PropertyListItem = PropertyListItem> =
  PropertyListContractProps<TItem> &
    Omit<ComponentPropsWithoutRef<"dl">, keyof PropertyListContractProps | "children">;
