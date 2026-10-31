/**
 * Stackra file contract:
 * Purpose: `sheetRows`, the rows of one SpreadsheetML sheet part as text cells: a shared, inline or formula string,
 *          rich text joined, a number, a boolean as `true`/`false`, an error as its code, a date-styled number or an
 *          ISO date cell as ISO 8601, and a formula as its cached result.
 * Boundary: pure; internal to the XLSX reader. A row with no cell value is not yielded, so row numbers can skip; a
 *           cell's column comes from its `r` reference, and a gap before it is `""`. A formula with no cached result
 *           is `""`: the reader never evaluates. A cell past the last column is `UnreadableWorkbookError`
 *           (`too_many_columns`), refused before any gap is filled. A value that is not a number or a date is its text.
 * Runtime: node
 * Governing contract: ADR 0367 (decisions 2 and 4); ECMA-376 part 1, 18.3.1 (sheet data).
 */
import { UnreadableWorkbookError } from "#core/errors/unreadable-workbook.error";
import { runText } from "#node/functions/run-text.function";
import { xmlAttribute } from "#node/functions/xml-attribute.function";
import { xmlText } from "#node/functions/xml-text.function";
import type { XlsxWorkbook } from "#node/types/xlsx-workbook.type";

/** Milliseconds per day, and the serial day of 1970-01-01 in the 1900 system (1462 days later in 1904). */
const DAY_MS = 86_400_000;
const EPOCH_1900 = 25_569;
const EPOCH_1904 = 24_107;

/** The zero-based column of a cell reference (`"C7"` → 2), or `undefined` without one. */
function columnOf(reference: string | undefined): number | undefined {
  const letters = /^[A-Z]+/i.exec(reference ?? "")?.[0];
  if (letters === undefined) return undefined;
  let column = 0;
  for (const letter of letters.toUpperCase())
    column = column * 26 + (letter.codePointAt(0) ?? 64) - 64;
  return column - 1;
}

/** The text of one `<c>` element, given its attributes and inner XML. */
function cellText(attributes: string, inner: string, book: XlsxWorkbook): string {
  const type = xmlAttribute(attributes, "t") ?? "n";
  if (type === "inlineStr") return runText(/<(?:[\w-]+:)?is\b[\s\S]*/.exec(inner)?.[0] ?? "");
  const raw = /<(?:[\w-]+:)?v\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?v>/.exec(inner)?.[1];
  if (raw === undefined) return "";
  const value = xmlText(raw);
  switch (type) {
    case "s": {
      return book.strings[Number(value)] ?? "";
    }
    case "b": {
      return value === "1" || value === "true" ? "true" : "false";
    }
    case "str":
    case "e": {
      return value;
    }
    case "d": {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toISOString();
    }
    default: {
      const number = Number(value);
      if (!Number.isFinite(number)) return value;
      if (!book.dateStyles.has(Number(xmlAttribute(attributes, "s") ?? 0))) return String(number);
      const epoch = book.date1904 ? EPOCH_1904 : EPOCH_1900;
      return new Date(Math.round((number - epoch) * DAY_MS)).toISOString();
    }
  }
}

/**
 * The rows of `xml`, a sheet part of `book`, with at most `columns` columns.
 *
 * @yields The row number and its cells.
 * @example
 * for (const row of sheetRows(xml, book, 16_384)) console.log(row.row, row.cells);
 */
export function* sheetRows(
  xml: string,
  book: XlsxWorkbook,
  columns: number,
): Generator<{ readonly row: number; readonly cells: string[] }> {
  let previous = 0;
  for (const match of xml.matchAll(
    /<(?:[\w-]+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w-]+:)?row>)/g,
  )) {
    const row = Number(xmlAttribute(match[1] ?? "", "r") ?? previous + 1);
    previous = row;
    const cells: string[] = [];
    for (const cell of (match[2] ?? "").matchAll(
      /<(?:[\w-]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w-]+:)?c>)/g,
    )) {
      const attributes = cell[1] ?? "";
      const column = columnOf(xmlAttribute(attributes, "r")) ?? cells.length;
      // Checked before the gap is filled, so a reference like `ZZZZZZ1` never allocates its columns.
      if (column >= columns) throw UnreadableWorkbookError.create({ reason: "too_many_columns" });
      const text = cellText(attributes, cell[2] ?? "", book);
      if (text === "") continue;
      while (cells.length < column) cells.push("");
      cells[column] = text;
    }
    if (cells.length > 0) yield { row, cells };
  }
}
