/**
 * Stackra file contract:
 * Purpose: `ColumnGroupRecord`, the runtime side of `ColumnGroup`: applies a nullability or a comment to each of its
 *          columns.
 * Boundary: internal; holds the column records of one blueprint and nothing else.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros return their columns).
 */
import type { ColumnRecord } from "#core/records/column.record";
import type { ColumnGroup } from "#core/types/column-group.type";

/** Columns set together. */
export class ColumnGroupRecord implements ColumnGroup {
  /** The grouped columns, in the order they were written. */
  readonly columns: readonly ColumnRecord[];

  /**
   * @param columns - the grouped columns.
   */
  constructor(columns: readonly ColumnRecord[]) {
    this.columns = columns;
  }

  /** Implements `ColumnGroup.notNull`, documented there. */
  notNull(): this {
    for (const column of this.columns) column.notNull();
    return this;
  }

  /** Implements `ColumnGroup.nullable`, documented there. */
  nullable(): this {
    for (const column of this.columns) column.nullable();
    return this;
  }

  /** Implements `ColumnGroup.comment`, documented there. */
  comment(text: string): this {
    for (const column of this.columns) column.comment(text);
    return this;
  }
}
