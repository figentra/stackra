/**
 * Stackra file contract:
 * Purpose: `TableNode`, a recorded resource table: its columns, filters, default sort (with its tiebreak keys) and count
 *          mode.
 * Boundary: a type only; gen compiles it into the closed `TableInput` of the list query.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1, 2 and 12); reporting gap 5 (multi-key sort).
 */
import type { Count } from "#core/enums/count.enum";
import type { ColumnNode } from "#core/types/column-node.type";
import type { FilterNode } from "#core/types/filter-node.type";
import type { SortNode } from "#core/types/sort-node.type";

/** A resource table. */
export interface TableNode {
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
