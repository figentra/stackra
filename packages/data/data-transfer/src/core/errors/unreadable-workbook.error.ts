/**
 * Stackra file contract:
 * Purpose: `UnreadableWorkbookError` (`unreadable_workbook`), the refusal of an XLSX upload the reader will not open:
 *          not a zip or not a workbook, an encrypted entry or an unknown compression method, an unsafe entry name, a
 *          zip bomb (too many entries, a compression ratio or an inflated size past the ceilings), a DTD, XML nested
 *          too deep, or a cell reference past the sheet's last column (STA-1736).
 * Boundary: a validation refusal (400), never retryable: the file is malformed or hostile, so re-sending it changes
 *           nothing. Its detail is the reason only, never the file's content or an entry name.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 4); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The workbook file cannot be read safely. */
export class UnreadableWorkbookError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** Why the file was refused. */
  reason!:
    | "not_a_zip"
    | "not_a_workbook"
    | "encrypted"
    | "compression_method"
    | "unsafe_entry_name"
    | "too_many_entries"
    | "compression_ratio"
    | "too_large"
    | "doctype"
    | "too_deep"
    | "too_many_columns";
}
