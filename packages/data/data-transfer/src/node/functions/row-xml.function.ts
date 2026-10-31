/**
 * Stackra file contract:
 * Purpose: `rowXml`, one written sheet row as SpreadsheetML: text as an inline string, a finite number as a number, a
 *          boolean as a boolean, a date as a serial number in style 1 (date and time), `null` as no cell.
 * Boundary: pure; internal to the XLSX writer. Text is never a formula, so no guard is needed. A non-finite number is
 *           written as its text.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); ECMA-376 part 1, 18.3.1 (sheet data).
 */
import { escapeXml } from "@stackra/support";

import type { TabularCell } from "#contracts/types/tabular-cell.type";

/** The column letters of a zero-based column (`2` → `"C"`). */
function letters(column: number): string {
  let name = "";
  for (let rest = column + 1; rest > 0; rest = Math.floor((rest - 1) / 26))
    name = String.fromCodePoint(65 + ((rest - 1) % 26)) + name;
  return name;
}

/** One cell, or `""` for `null`. */
function cellXml(value: TabularCell, reference: string): string {
  if (value === null) return "";
  if (value instanceof Date)
    return `<c r="${reference}" s="1"><v>${value.getTime() / 86_400_000 + 25_569}</v></c>`;
  if (typeof value === "boolean") return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
  if (typeof value === "number" && Number.isFinite(value))
    return `<c r="${reference}"><v>${value}</v></c>`;
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}

/**
 * Row `row` (from 1) of `cells` as XML.
 *
 * @example
 * rowXml(2, ["قلم", 5]); // '<row r="2"><c r="A2" t="inlineStr">…</c><c r="B2"><v>5</v></c></row>'
 */
export function rowXml(row: number, cells: readonly TabularCell[]): string {
  return `<row r="${row}">${cells.map((cell, column) => cellXml(cell, `${letters(column)}${row}`)).join("")}</row>`;
}
