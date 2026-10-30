/**
 * Stackra file contract:
 * Purpose: `WidgetData`, the numbers behind a widget as raw cells: the column headers and one row per category. The
 *          widget's "View as table" writes them in the locale; its CSV download writes them as they are.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 14 to 18); ADR 0305 (one declaration per file); STA-1371.
 */

/** A widget's data as columns and rows of raw cells. */
export interface WidgetData {
  /** The column headers, in the reader's language. */
  readonly head: readonly string[];
  /** One row per category: the category first, then one cell per column; a gap is `null`. */
  readonly rows: readonly (readonly (string | number | null | undefined)[])[];
  /** How "View as table" writes the first column when it holds dates (`{ month: "short" }`); as given without it. */
  readonly categoryFormat?: Intl.DateTimeFormatOptions | undefined;
  /** How "View as table" writes the numbers; the CSV keeps them raw. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
}
