/**
 * Stackra file contract:
 * Purpose: `DataTableProps`, the props of the web `DataTable` in `data-table.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract); ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2 and 4 to 6); ADR 0139 (action UX); WCAG
 *          2.2 SC 1.3.1, 2.4.3, 4.1.2, 4.1.3; owner decision 6 of STA-350 (thin wrappers).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";
import type { DataTableRows } from "#react/data-table/data-table-rows.type";

/**
 * Props of the web DataTable: the shared contract, the web row tools (`DataTableRows`) and the attributes of its root `div`, passed through. The rows and
 * cells are `items` and `renderCell`, so children are refused.
 */
export type DataTableProps<TItem extends CollectionItem = CollectionItem> =
  DataTableContractProps<TItem> &
    DataTableRows<TItem> &
    Omit<
      ComponentPropsWithoutRef<"div">,
      keyof DataTableContractProps | keyof DataTableRows | "children" | "isVirtualized"
    > & {
      /**
       * Web: true to draw only the rows in view (the Table's virtual scrolling), for thousands of rows: the header and
       * the start pins stay stuck, group and detail rows scroll with the rest, and the rows scroll inside `maxHeight`.
       */
      readonly isVirtualized?: boolean | undefined;
    };
