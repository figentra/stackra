/**
 * Stackra file contract:
 * Purpose: `cellText`, the text of a workbook cell value: rich text joined, a formula's cached result, a hyperlink's
 *          text, a date as ISO 8601, an error as its code.
 * Boundary: pure; internal to the XLSX reader. A formula with no cached result is empty: the reader never evaluates.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2).
 */
import type { CellValue } from "exceljs";

/**
 * The text of `value`.
 *
 * @example
 * cellText({ richText: [{ text: "مر" }, { text: "حبا" }] }); // "مرحبا"
 */
export function cellText(value: CellValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return String(value);
  if ("richText" in value) return value.richText.map((part) => part.text).join("");
  if ("formula" in value || "sharedFormula" in value)
    return cellText((value as { result?: CellValue }).result);
  if ("hyperlink" in value) return cellText(value.text as CellValue);
  if ("error" in value) return value.error;
  return "";
}
