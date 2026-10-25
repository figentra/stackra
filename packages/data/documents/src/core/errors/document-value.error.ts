/**
 * Stackra file contract:
 * Purpose: `DocumentValueError` (`document_value`), the refusal of render data that lacks a value a template needs,
 *          holds one of the wrong shape, or sets a key the renderer reserves.
 * Boundary: a validation refusal (400), never retryable. A document is never printed with a hole: a missing value is
 *           refused, not left blank. Its details are the path and the reason, never the value.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A value of the render data is missing or unusable. */
export class DocumentValueError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The path into the data (`order.total`). */
  path!: string;

  /** `missing`, `invalid` or `reserved`. */
  reason!: string;
}
