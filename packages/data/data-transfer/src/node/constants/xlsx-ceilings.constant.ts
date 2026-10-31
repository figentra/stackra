/**
 * Stackra file contract:
 * Purpose: `XLSX_CEILINGS`, the structural ceilings the XLSX reader holds every upload to, whatever the caller's
 *          limits: zip entries, the compression ratio of one entry, the inflated size of one part and of the whole
 *          file, XML nesting depth, and the last column (STA-1736).
 * Boundary: data only; safety bounds against zip bombs and hostile XML, not business limits. Rows, bytes, columns and
 *           cell length a product allows are the caller's `TransferLimits` (ADR 0363).
 * Runtime: node
 * Governing contract: ADR 0367 (decision 4); ECMA-376 part 1 (16,384 columns per sheet).
 */
import type { XlsxCeilings } from "#node/types/xlsx-ceilings.type";

/** The ceilings every read uses. A real workbook stays far below each. */
export const XLSX_CEILINGS: XlsxCeilings = {
  entries: 10_000,
  ratio: 200,
  partBytes: 256 * 1024 * 1024,
  totalBytes: 512 * 1024 * 1024,
  depth: 64,
  columns: 16_384,
};
