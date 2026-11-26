/**
 * Stackra file contract:
 * Purpose: `TamoTableColumn`, one column of a `TamoTablePart`: the row field it reads, its heading and an
 *          optional value type.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** One column of a table part. */
export interface TamoTableColumn {
  /** The row field the column reads. */
  readonly id: string;

  /** The column's heading. */
  readonly label: string;

  /** The value type, for example `money` or `date`, so the renderer formats it; left out, the value is shown as is. */
  readonly type?: string | undefined;
}
