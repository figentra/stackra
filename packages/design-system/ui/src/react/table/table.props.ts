/**
 * Stackra file contract:
 * Purpose: `TableProps`, the props of the web `Table` in `table.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0313; WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2, 4.1.3; owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";

/**
 * Props of the web Table: the shared contract plus the `div` props of HeroUI's table root, passed through unchanged
 * (a `className`, a `data-*` attribute, an `id`). The app lists rows as `items` and cells as `renderCell`, so
 * children are refused.
 */
export type TableProps<TItem extends CollectionItem = CollectionItem> = TableContractProps<TItem> &
  Omit<ComponentPropsWithoutRef<"div">, keyof TableContractProps | "children">;
