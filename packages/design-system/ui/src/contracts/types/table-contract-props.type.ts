/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Table` takes: the shared collection and selection props over rows (`items`,
 *          `emptyState`, `isLoading`, `loadingLabel`, `selectionMode` and the selected ids), the columns, the cell
 *          renderer, the controlled sort, the end-of-list paging, the sticky header, and the column tools: multi-sort marks, density, resize, drag to reorder, pinning and a header menu slot. Each runtime's `TableProps` is
 *          this plus the props its HeroUI table root takes, which pass through unchanged.
 * Boundary: types only. The table never sorts, filters or pages the rows it is given: the query that fetched them did,
 *           so `sort` is controlled and `hasMore` is the cursor page's own flag (ADR 0313 decisions 3 and 4).
 *           The native table is the adapted form: a list of rows with a sort chooser in its header, and it reads
 *           `variant`, `isStickyHeader` and `maxHeight` as nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native, adapted forms); ADR 0303 (decision 7); ADR 0313;
 *          data-collection plan (owner, 2026-10-29); ADR 0505 (`sort[]` replaced `sortDescriptor`).
 */
import type { ReactNode } from "react";

import type { CollectionDensity } from "#contracts/enums/collection-density.enum";
import type { TableVariant } from "#contracts/enums/table-variant.enum";
import type { CollectionContractProps } from "#contracts/types/collection-contract-props.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { SelectionContractProps } from "#contracts/types/selection-contract-props.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";
import type { TableColumn } from "#contracts/types/table-column.type";

/** Props shared by the web and native `Table`. */
export interface TableContractProps<TItem extends CollectionItem = CollectionItem>
  extends CollectionContractProps<TItem>, SelectionContractProps {
  /** The spoken name of the table, for example "Orders"; a table without one is anonymous to assistive technology. */
  readonly label: string;
  /** The columns, in reading order. */
  readonly columns: readonly TableColumn[];
  /**
   * The content of one cell. Left out, a cell shows the text of the row's property named by the column's `id`; give it
   * to draw a badge, a date or a link, and give the app's own text for each value, as the table adds none.
   */
  readonly renderCell?: ((item: TItem, column: TableColumn) => ReactNode) | undefined;
  /** The look of the table. Defaults to `primary`. */
  readonly variant?: TableVariant | undefined;
  /** Called with the sort a press on a sortable header asks for; the app fetches the rows in that order. */
  readonly onSortChange?: ((sort: SortDescriptor) => void) | undefined;
  /** True while a cursor page after the last row exists; with `onLoadMore` it loads it when the end comes into view. */
  readonly hasMore?: boolean | undefined;
  /** Called when the end of the rows is reached while `hasMore` is true and nothing is loading. */
  readonly onLoadMore?: (() => void) | undefined;
  /** True to keep the header in view while the rows scroll; the table then scrolls inside `maxHeight`. */
  readonly isStickyHeader?: boolean | undefined;
  /** The height the rows scroll inside when the header is sticky, as a CSS length. Defaults to `24rem`. */
  readonly maxHeight?: string | undefined;
  /**
   * The sort in force, every key most significant first, for a controlled table: the rows arrive sorted, and this only
   * marks the headers (the first by its direction, the others by their rank too).
   */
  readonly sort?: readonly SortDescriptor[] | undefined;
  /** How tightly the rows are drawn: `compact`, `normal` (the default) or `roomy`. Native reads it as nothing. */
  readonly density?: CollectionDensity | undefined;
  /**
   * Web: true to give each header a resize handle (pointer, and the keyboard through the column menu's "Resize"); the
   * columns then take their `width`, `minWidth` and `maxWidth`, and the table scrolls sideways past its width.
   */
  readonly isColumnResizable?: boolean | undefined;
  /** Web: called with a column's new width, in CSS pixels, when a resize ends. */
  readonly onColumnResize?: ((columnId: string, width: number) => void) | undefined;
  /** Web: given, headers can be dragged to reorder the columns; called with the column and its new index. */
  readonly onColumnMove?: ((columnId: string, toIndex: number) => void) | undefined;
  /**
   * Web: what sits at the end of a header, usually the column's menu. `startResize` starts a keyboard resize of the
   * column (arrows, then Enter or Escape) when the table is resizable.
   */
  readonly renderColumnMenu?:
    | ((column: TableColumn, tools: { readonly startResize: () => void }) => ReactNode)
    | undefined;
}
