/**
 * Stackra file contract:
 * Purpose: `parseTsv()`, the cells of tab-separated text as spreadsheets put it on the clipboard: rows split by line
 *          breaks, cells by tabs, and a quoted cell may hold tabs, line breaks and doubled quotes.
 * Boundary: a pure function; the trailing line break spreadsheets add is dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid copy and paste).
 */

/**
 * The rows of cells in `text`.
 * @param text - tab-separated text, for example from Excel, Numbers or Google Sheets
 * @returns one array of cell strings per row
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let index = 0;
  const source = text.replaceAll(/\r\n?/g, "\n").replace(/\n$/, "");
  while (index < source.length) {
    const char = source[index] ?? "";
    if (char === '"' && cell === "") {
      // A quoted cell: read to the closing quote, a doubled quote standing for one.
      index += 1;
      while (index < source.length) {
        const inner = source[index] ?? "";
        if (inner === '"' && source[index + 1] === '"') {
          cell += '"';
          index += 2;
        } else if (inner === '"') {
          index += 1;
          break;
        } else {
          cell += inner;
          index += 1;
        }
      }
      continue;
    }
    if (char === "\t") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
    index += 1;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}
