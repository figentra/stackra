/**
 * Stackra file contract:
 * Purpose: `ReportRequestInvalidError`, the refusal of a report run whose request names a dimension, grain, measure,
 *          filter, sort key or pivot axis the report does not declare, or carries a bad limit or cursor.
 * Boundary: a refusal (`validation`); `report` is the report's written key and `reason` says what is wrong. A filter
 *           value outside the table filter vocabulary is `TableFilterInvalidError` instead.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 2: nothing outside the declaration can be asked for); ADR 0140 (refusals);
 *                     ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A report request asks for something the report does not declare. */
export class ReportRequestInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The report's written key, such as `order_sales`. */
  report!: string;

  /** What is wrong, such as `unknown measure "margin"`. */
  reason!: string;
}
