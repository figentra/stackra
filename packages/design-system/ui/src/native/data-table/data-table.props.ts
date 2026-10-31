/**
 * Stackra file contract:
 * Purpose: `DataTableProps`, the props of the native `DataTable` in `data-table.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0303 (decision 7); ADR 0313; ADR 0505 (one data family); ADR 0139 (action
 *          UX); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2; owner decision 6 of STA-350 (thin wrappers).
 */
import type { ViewProps } from "react-native";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";

/**
 * Props of the native DataTable: the shared contract plus the props of a `View`, passed through. The rows and cells are
 * `items` and `renderCell`, so children are refused.
 */
export type DataTableProps<TItem extends CollectionItem = CollectionItem> =
  DataTableContractProps<TItem> &
    Omit<ViewProps, keyof DataTableContractProps | "children"> & {
      /**
       * Whether the rows scroll on their own (the default). Pass `false` when the table sits inside a page's own
       * `ScrollView`, so the rows lay out in the page and React Native does not warn about nested lists.
       */
      readonly scrollEnabled?: boolean;
    };
