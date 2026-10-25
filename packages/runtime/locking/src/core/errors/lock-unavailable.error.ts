/**
 * Stackra file contract:
 * Purpose: `LockUnavailableError`, the refusal of `Locks.with` when its keys stayed held for the whole wait
 *          (`lock_unavailable`).
 * Boundary: kind `Unavailable` (HTTP 503), retryable: the holder ends or its lease lapses, so a retry may run. It
 *           carries no details, so a lock key, an internal name, never reaches a caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0149; final review R-02 (typed `create`); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Retryable: the keys were busy, not wrong.
 *
 * @example
 * throw LockUnavailableError.create();
 */
export class LockUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
