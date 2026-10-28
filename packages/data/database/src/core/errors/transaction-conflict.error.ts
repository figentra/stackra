/**
 * Stackra file contract:
 * Purpose: `TransactionConflictError`, the refusal of a call whose transaction lost to a concurrent one: a deadlock
 *          (`40P01`), a serialization failure (`40001`), a lock it could not take in time (`55P03`) or a statement
 *          that ran past its timeout (`57014`).
 * Boundary: a refusal (`unavailable`, 503) that is retryable: the same call may succeed when run again. Carries no
 *           details. Raised by `translateDbError`.
 * Runtime: node
 * Governing contract: ADR 0140 (refusals); ADR 0328 (built with `create`); data-layer gap mo6.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A concurrent transaction won; retry the call. */
export class TransactionConflictError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
