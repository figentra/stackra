/**
 * Stackra file contract:
 * Purpose: `TableProps`, the props of the native `Table` in `table.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0313; ADR 0165
 *          (HeroUI Native on native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import type { FlatListProps } from "react-native";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";

/**
 * Props of the native Table: the shared contract plus the props of React Native's `FlatList`, passed through
 * unchanged. The app lists rows as `items` and cells as `renderCell`, so the list's own data, row renderer, key
 * extractor, header, footer, empty component and end-reached callback are refused.
 */
export type TableProps<TItem extends CollectionItem = CollectionItem> = TableContractProps<TItem> &
  Omit<
    FlatListProps<TItem>,
    | keyof TableContractProps
    | "data"
    | "renderItem"
    | "keyExtractor"
    | "extraData"
    | "ListHeaderComponent"
    | "ListFooterComponent"
    | "ListEmptyComponent"
    | "onEndReached"
    | "children"
  >;
