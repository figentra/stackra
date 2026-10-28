/**
 * Stackra file contract:
 * Purpose: `TableFilterInvalidError`, the refusal of a table read whose filter value or sort is outside the closed
 *          vocabulary (`TableFilter`): an unknown operator, an object operand, an empty range, or a named date range
 *          the read cannot resolve.
 * Boundary: a refusal (`validation`); `key` names the filter or sort path and `reason` says what is wrong.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: the table is a server contract); ADR 0140 (refusals).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A table read's filter value or sort is not in the closed vocabulary. */
export class TableFilterInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The filter or sort path, such as `createdAt`. */
  key!: string;

  /** What is wrong, such as `unknown operator "like"`. */
  reason!: string;
}
