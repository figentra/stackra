/**
 * Stackra file contract:
 * Purpose: `ColumnGroup`, a set of columns that take their nullability and comment together: what a macro returns
 *          (`t.group(...)`) and what the field-type macros give (`t.money("total")`, `t.translatable(["title"])`).
 * Boundary: a type only. A call applies to every column of the group; a money pair keeps its own suffix on each
 *           comment (minor units, currency).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (column conventions are `Macro`s).
 */

/** Columns set together. */
export interface ColumnGroup {
  /** Every column refuses null. */
  notNull: () => this;

  /** Every column accepts null. */
  nullable: () => this;

  /** Every column's comment. */
  comment: (text: string) => this;
}
