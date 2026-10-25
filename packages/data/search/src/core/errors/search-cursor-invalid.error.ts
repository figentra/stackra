/**
 * Stackra file contract:
 * Purpose: `SearchCursorInvalidError`, the refusal of a search page asked for with a cursor no earlier page gave
 *          (`search_cursor_invalid`).
 * Boundary: raised by `SearchIndex.page` before any driver call; kind `Validation` (HTTP 400), not retryable, with the
 *           field error on `cursor`. It carries no details, so the cursor's form stays the package's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); cursor pagination in the HTTP conventions; final review R-02
 *                     (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: only a cursor from an earlier page changes the answer.
 *
 * @example
 * throw SearchCursorInvalidError.create({}, { fieldErrors: { cursor: "search_cursor_invalid" } });
 */
export class SearchCursorInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
