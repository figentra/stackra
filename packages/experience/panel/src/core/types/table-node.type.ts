/**
 * Stackra file contract:
 * Purpose: `TableNode`, a recorded resource table: its columns, filters, default sort (with its tiebreak keys), count
 *          mode, and its look: the table flags of `TableColumnSpec`, the filter bar's words of `FilterSpec`, the
 *          empty state (`EmptyStateSpec`), the row menu (`RowActionsSpec`) and the bulk bar (`BulkActionsSpec`).
 * Boundary: a type only; gen compiles it into the closed `TableInput` of the list query. The look holds no actions: the
 *           buttons are the resource's placements at each place. The bulk bar keeps its plain fields only (its count
 *           words are functions).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1, 2 and 12); reporting gap 5 (multi-key sort); the SDUI catalogue cases
 *                     `tableColumns`, `tableFilters`, `emptyStates`, `rowActions` and `bulkActions` (STA-1981).
 */
import type { Count } from "#core/enums/count.enum";
import type { BulkActionsSpec } from "#core/types/bulk-actions-spec.type";
import type { ColumnNode } from "#core/types/column-node.type";
import type { EmptyStateSpec } from "#core/types/empty-state-spec.type";
import type { FilterNode } from "#core/types/filter-node.type";
import type { FilterSpec } from "#core/types/filter-spec.type";
import type { RowActionsSpec } from "#core/types/row-actions-spec.type";
import type { SortNode } from "#core/types/sort-node.type";
import type { TableColumnSpec } from "#core/types/table-column-spec.type";

/** A resource table. */
export interface TableNode
  extends
    Pick<TableColumnSpec, "isStickyHeader" | "hasColumnTools" | "isColumnResizable">,
    Partial<Pick<FilterSpec, "searchPlaceholder" | "searchLabel" | "canSaveView">> {
  /** The empty list; its title defaults to the resource's, its buttons are the placements at `empty`. */
  readonly empty?: Partial<Omit<EmptyStateSpec, "actions">> | undefined;

  /** The row menu; its actions are the placements at `row`. */
  readonly rowActions?: Partial<Omit<RowActionsSpec, "actions">> | undefined;

  /** The bulk bar; its actions are the placements at `bulk`. */
  readonly bulkActions?:
    | Pick<
        BulkActionsSpec,
        | "label"
        | "clearLabel"
        | "moreActionsLabel"
        | "variant"
        | "runMode"
        | "allowSelectAllMatching"
        | "export"
      >
    | undefined;

  /** The columns, in order. */
  readonly columns: readonly ColumnNode[];

  /** The filters, in order. */
  readonly filters: readonly FilterNode[];

  /** The sort a fresh list starts with. */
  readonly defaultSort?: SortNode;

  /** The keys the default sort continues with when rows tie, in order (at most two; the server takes three keys). */
  readonly thenSort?: readonly SortNode[];

  /** How the rows are counted. */
  readonly count: Count;
}
