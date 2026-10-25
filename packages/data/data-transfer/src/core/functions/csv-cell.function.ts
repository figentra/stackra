/**
 * Stackra file contract:
 * Purpose: `csvCell`, one cell as CSV text: quoted when it holds the delimiter, a quote or a line break, and, with the
 *          formula guard on, prefixed with `'` when a spreadsheet would run it as a formula.
 * Boundary: pure; internal to the CSV writer. Only text cells are guarded: a number such as `-5` stays a number.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 10).
 */
import type { TabularCell } from "#contracts/types/tabular-cell.type";
import { FORMULA_PREFIXES } from "#core/constants/formula-prefixes.constant";

/**
 * The CSV text of `value`.
 *
 * @example
 * csvCell('say "hi", now', ",", true); // "\"say \"\"hi\"\", now\""
 * csvCell("=SUM(A1)", ",", true); // "'=SUM(A1)"
 */
export function csvCell(value: TabularCell, delimiter: string, isGuarded: boolean): string {
  if (value === null) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (isGuarded && typeof value === "string" && FORMULA_PREFIXES.includes(text.charAt(0)))
    text = `'${text}`;
  return text.includes(delimiter) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
