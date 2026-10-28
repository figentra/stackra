/**
 * Stackra file contract:
 * Purpose: `ColumnBuilder`, one column under construction: copyable, sortable, hidden.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 2: a sortable key needs an index).
 */
import type { Built } from "#core/types/built.type";
import type { ColumnNode } from "#core/types/column-node.type";

/** The chainable builder of one table column. */
export interface ColumnBuilder extends Built<ColumnNode> {
  /** Adds a copy button to the cell. */
  copyable: () => this;

  /** Makes the column sortable; the key needs an index. */
  sortable: () => this;

  /** Starts the column hidden in the column picker. */
  hidden: () => this;
}
