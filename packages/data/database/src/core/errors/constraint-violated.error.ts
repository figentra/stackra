/**
 * Stackra file contract:
 * Purpose: `ConstraintViolatedError`, the refusal of a write a foreign key, check or not-null constraint rejects
 *          (Postgres `23503`, `23514`, `23502`): the input names a record that does not exist or breaks a column rule.
 * Boundary: a refusal (`validation`, 400), not retryable. `constraint` names the constraint (or, for not-null, the
 *           column), never a value. Raised by `translateDbError`; an input schema should catch these first.
 * Runtime: node
 * Governing contract: ADR 0140 (refusals); ADR 0328 (built with `create`); data-layer gap mo6.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A database constraint refused the write. */
export class ConstraintViolatedError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The violated constraint's name (`fk_...`, `ck_...`) or the not-null column. */
  constraint!: string;
}
