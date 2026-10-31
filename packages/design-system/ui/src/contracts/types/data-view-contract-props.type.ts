/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DataView` takes: a collection engine, the views it offers (table, grid, list, cards; board in wave 4) and how each draws a row, the row and bulk actions, export, import, share and refresh.
 * Boundary: types only. Every view draws from the same engine, so switching keeps the search, filter, sort and columns; `renderLayout` is the slot of a view the component does not draw itself (the board).
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0505 (one column type: the grid
 *          and inline-edit columns are the engine's); STA-1371.
 */
import type { ReactNode } from "react";

import type { CollectionLayout } from "#contracts/enums/collection-layout.enum";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionView } from "#contracts/types/collection-view.type";
import type { DataGridChanges } from "#contracts/types/data-grid-changes.type";
import type { DataViewFields } from "#contracts/types/data-view-fields.type";
import type { ExportDialogContractProps } from "#contracts/types/export-dialog-contract-props.type";
import type { ImportDialogContractProps } from "#contracts/types/import-dialog-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import type { SelectionContractProps } from "#contracts/types/selection-contract-props.type";
import type { TableColumn } from "#contracts/types/table-column.type";

/** Props shared by the web and native `DataView`. */
export interface DataViewContractProps<TItem extends CollectionItem = CollectionItem> {
  /** The name of the records, for example "Orders": the table's name and the toolbar's. */
  readonly label: string;
  /** The engine every view draws from (`useCollection`). */
  readonly collection: CollectionController<TItem>;
  /**
   * The views offered by the switcher, in order. Defaults to table, list and cards, with grid when `onGridSave` is
   * given (web) and board when `board` is (web); native offers list and cards.
   */
  readonly layouts?: readonly CollectionLayout[] | undefined;
  /** The view a phone opens on when the engine was never switched: `list` (the default) or `cards`. */
  readonly phoneLayout?: "list" | "cards" | undefined;
  /** The content of a table cell; left out, the column's text. */
  readonly renderCell?: ((item: TItem, column: TableColumn) => ReactNode) | undefined;
  /** What a list row shows. */
  readonly list?: DataViewFields<TItem> | undefined;
  /** What a card shows. */
  readonly cards?: DataViewFields<TItem> | undefined;
  /** Called when a list row or a card is pressed, for example to open the record. */
  readonly onItemPress?: ((item: TItem) => void) | undefined;
  /** The actions of one row, in the table's row menu. */
  readonly rowActions?: ((item: TItem) => readonly ResourceAction[]) | undefined;
  /** The actions on the selection, in the bulk bar. */
  readonly bulkActions?: readonly ResourceAction[] | undefined;
  /** How many rows can be selected in the table. Defaults to `none`, or `multiple` with `bulkActions`. */
  readonly selectionMode?: SelectionContractProps["selectionMode"];
  /** Web: saves the grid view's edited cells; given, the grid is offered. Its columns are the engine's. */
  readonly onGridSave?: ((changes: DataGridChanges) => void | Promise<void>) | undefined;
  /** The export dialog's options; given, the toolbar has Export. The counts default to the engine's. */
  readonly exportOptions?:
    | (Omit<ExportDialogContractProps, "trigger" | "counts"> &
        Partial<Pick<ExportDialogContractProps, "counts">>)
    | undefined;
  /** The import dialog's options; given, the toolbar has Import. */
  readonly importOptions?: Omit<ImportDialogContractProps, "trigger"> | undefined;
  /** Shares a saved view; given, the views menu has "Share view". */
  readonly onShareView?: ((view: CollectionView) => void) | undefined;
  /** Fetches the rows again; defaults to the engine's own refresh in server mode, and no Refresh otherwise. */
  readonly onRefresh?: (() => void) | undefined;
  /** False to leave out the full-screen button. Defaults to true on web. */
  readonly hasFullscreen?: boolean | undefined;
  /** Draws a view the component does not (the board of wave 4), or replaces one, by layout. */
  readonly renderLayout?: Partial<Record<CollectionLayout, () => ReactNode>> | undefined;
  /** What shows when there are no rows at all. */
  readonly emptyState?: ReactNode;
}
