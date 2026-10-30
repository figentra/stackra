/**
 * Stackra file contract:
 * Purpose: `toTsv()`, rows of cell text as tab-separated text a spreadsheet pastes: a cell that holds a tab, a line
 *          break or a quote is quoted, with its quotes doubled.
 * Boundary: a pure function; `parseTsv` reads its output back unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid copy and paste).
 */

/** A cell quoted when it holds a tab, a line break or a quote, its quotes doubled. */
const quote = (cell: string) => (/[\t\n\r"]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell);

/**
 * The tab-separated text of `rows`.
 * @param rows - the cells' text, one array per row
 * @returns the text, rows joined by line breaks
 */
export function toTsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(quote).join("\t")).join("\n");
}
