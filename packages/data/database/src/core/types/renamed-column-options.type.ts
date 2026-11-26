/**
 * Stackra file contract:
 * Purpose: `RenamedColumnOptions`, what `t.renameColumn(from, to, options)` and the contract options of
 *          `t.finishRenameColumn` state: the column's SQL type, as a literal, so the new column is written with it and
 *          a dev inverse can write the old one back.
 * Boundary: a type only; the type is one a blueprint writes.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (literal snapshots).
 */

/** The renamed column's type. */
export interface RenamedColumnOptions {
  /** Its SQL type, one a blueprint writes: `varchar(200)`, `text`, `bigint`, `timestamptz`, … */
  readonly type: string;
}
