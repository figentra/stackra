/**
 * Stackra file contract:
 * Purpose: `XlsxWorkbook`, what the XLSX reader needs from a workbook before it reads a sheet: the sheets in order,
 *          the shared strings, the styles that show a date and the date system.
 * Boundary: a type only; internal to the XLSX reader.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2).
 */

/** A workbook's sheet list and the tables its cells refer to. */
export interface XlsxWorkbook {
  /** The sheets in workbook order: the name and the zip path of the sheet part. */
  readonly sheets: readonly { readonly name: string; readonly path: string }[];

  /** The shared strings, by index. */
  readonly strings: readonly string[];

  /** The `s` indexes of the cell styles whose number format shows a date or time. */
  readonly dateStyles: ReadonlySet<number>;

  /** Whether serial numbers count from 1904 (`workbookPr date1904`) instead of 1900. */
  readonly date1904: boolean;
}
