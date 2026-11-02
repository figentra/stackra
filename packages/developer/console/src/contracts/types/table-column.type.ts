/**
 * Stackra file contract:
 * Purpose: `TableColumn`, one column of a table: its header, the row key it reads, its kind (text, a status cell, a
 *          command, a count) and its alignment.
 * Boundary: a type only. A status column is coloured and carries a symbol and a word; status and command cells are
 *           never truncated.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-008.
 */

/** A column of a table. */
export interface TableColumn {
  /** The header text. */
  readonly header: string;

  /** The row field the cell shows. */
  readonly key: string;

  /** How the cell is drawn; `text` when absent. */
  readonly kind?: "text" | "status" | "command" | "count";

  /** `right` for numbers; `left` when absent (a `count` column is right-aligned by default). */
  readonly align?: "left" | "right";
}
