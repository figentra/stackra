/**
 * Stackra file contract:
 * Purpose: `TamoTablePart`, the data of a `data-tamo-table` part: columns, rows keyed by column id, and the
 *          query key it came from.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoTableCell } from "#contracts/types/tamo-table-cell.type";
import type { TamoTableColumn } from "#contracts/types/tamo-table-column.type";

/** A table in a chat turn. */
export interface TamoTablePart {
  /** The columns, in order. */
  readonly columns: readonly TamoTableColumn[];

  /** The rows, each keyed by column id. */
  readonly rows: readonly Readonly<Record<string, TamoTableCell>>[];

  /** The key of the query that produced the rows, so the host can open the full list. */
  readonly sourceKey?: string | undefined;
}
