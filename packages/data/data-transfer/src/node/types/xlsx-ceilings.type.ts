/**
 * Stackra file contract:
 * Purpose: `XlsxCeilings`, the structural ceilings of one XLSX read: zip entries, the compression ratio of one entry,
 *          the inflated size of one part and of the whole file, XML nesting depth and the last column (STA-1736).
 * Boundary: a type only; internal to the XLSX reader. The values are `XLSX_CEILINGS`.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 4).
 */

/** The ceilings of one XLSX read. */
export interface XlsxCeilings {
  /** The most zip entries. */
  readonly entries: number;

  /** The most uncompressed bytes per compressed byte of one entry. */
  readonly ratio: number;

  /** The most uncompressed bytes of one part. */
  readonly partBytes: number;

  /** The most uncompressed bytes read from the whole file. */
  readonly totalBytes: number;

  /** The deepest XML element nesting. */
  readonly depth: number;

  /** The most columns of a sheet (`XFD`). */
  readonly columns: number;
}
