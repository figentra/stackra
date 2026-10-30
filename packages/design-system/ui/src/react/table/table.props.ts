/**
 * Stackra file contract:
 * Purpose: `TableProps`, the props of the web `Table` in `table.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0313; WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2, 4.1.3; owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";

/**
 * Props of the web Table: the shared contract plus the `div` props of HeroUI's table root, passed through unchanged
 * (a `className`, a `data-*` attribute, an `id`). The app lists rows as `items` and cells as `renderCell`, so
 * children are refused.
 */
export type TableProps<TItem extends CollectionItem = CollectionItem> = TableContractProps<TItem> &
  Omit<ComponentPropsWithoutRef<"div">, keyof TableContractProps | "children"> & {
    /** Web: extra classes of one row, for example a sticky total row. */
    readonly rowClassName?: ((item: TItem) => string | undefined) | undefined;
    /**
     * Web: given, each row gets a drag handle in a leading column (pointer, or the keyboard and a screen reader through
     * React Aria's drag and drop) and a drop calls this with every row in the new order. Controlled: nothing moves
     * until the app passes the rows back.
     */
    readonly onReorder?: ((items: readonly TItem[]) => void) | undefined;
    /** Web: a row drawn as one cell across every column (an expanded row's detail) when this returns a node. */
    readonly renderRowSpan?: ((item: TItem) => ReactNode) | undefined;
    /** Web: called with a row's id when the row is actioned: a press with no selection mode, or Enter on the row. */
    readonly onRowAction?: ((id: string) => void) | undefined;
    /** Web: the ids of rows that cannot be selected or dragged (summary and detail rows); their content stays live. */
    readonly disabledKeys?: readonly string[] | undefined;
    /** Web: a header's content in place of its label, when this returns a node (the label stays its name). */
    readonly renderHeader?: ((column: TableColumn) => ReactNode) | undefined;
    /** Web: the ids of columns that never move: they draw no drag grip and take no drop (a DataTable's tool columns). */
    readonly fixedColumns?: readonly string[] | undefined;
    /**
     * Web: true to draw only the rows in view (React Aria's Virtualizer), for thousands of rows. The header stays
     * stuck, the start pins stay stuck, rows take the density's height (measured when `renderRowSpan` is given) and
     * the scroll area is `maxHeight` tall. A column pinned to the end scrolls with the rest.
     */
    readonly isVirtualized?: boolean | undefined;
  };
