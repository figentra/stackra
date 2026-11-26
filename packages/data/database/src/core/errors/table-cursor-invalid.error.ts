/**
 * Stackra file contract:
 * Purpose: `TableCursorInvalidError`, the refusal of a table read asked for with a cursor no earlier page gave
 *          (`table_cursor_invalid`): malformed, forged or from another table.
 * Boundary: raised by `CrudService.table` when the keyset read cannot use the input's cursor; kind `Validation` (HTTP
 *           400), not retryable, with the field error on `cursor`. It carries no details, so the cursor's form stays the
 *           package's own.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: the table is a server contract); ADR 0140 (envelope and kinds); cursor
 *                     pagination in the HTTP conventions; STA-2856.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: only a cursor from an earlier page changes the answer.
 *
 * @example
 * throw TableCursorInvalidError.create({}, { fieldErrors: { cursor: "table_cursor_invalid" } });
 */
export class TableCursorInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
