/**
 * Stackra file contract:
 * Purpose: `ImportPreview`, what the app found when it read an import file: the column names, the first row as a
 *          hint and the number of data rows.
 * Boundary: types only. Reading the file (CSV or Excel) is the app's; the ImportDialog only shows the result.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** The shape of an import file, read by the app. */
export interface ImportPreview {
  /** The file's column names, in order. */
  readonly columns: readonly string[];
  /** The first value of each column, shown as a hint beside it. */
  readonly sample?: Readonly<Record<string, string>> | undefined;
  /** The number of data rows, after the header; shown beside the file name. */
  readonly rowCount?: number | undefined;
}
