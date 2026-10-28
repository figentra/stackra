/**
 * Stackra file contract:
 * Purpose: `DuplicateRecordError`, the refusal of a write a unique constraint rejects (Postgres `23505`): a record with
 *          the same unique value already exists.
 * Boundary: a refusal (`conflict`, 409), not retryable. `constraint` names the violated index (`uq_...`, `idx_...`),
 *           never the conflicting value, so no other record's data travels with it. Raised by `translateDbError`.
 * Runtime: node
 * Governing contract: ADR 0140 (refusals); ADR 0328 (built with `create`); data-layer gap mo6.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A unique value is taken. */
export class DuplicateRecordError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The violated constraint's name, or an empty string when the driver did not report one. */
  constraint!: string;
}
