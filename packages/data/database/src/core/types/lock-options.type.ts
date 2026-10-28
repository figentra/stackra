/**
 * Stackra file contract:
 * Purpose: `LockOptions`, how `Repository.lock(where, options)` takes its row lock: shared instead of exclusive, and
 *          what it does when another transaction already holds the row: wait (the default), fail at once (`nowait`),
 *          or pass over it to the next matching row (`skipLocked`, a work-queue claim).
 * Boundary: a type only. `nowait` and `skipLocked` exclude each other. A `nowait` lock that cannot be had fails with
 *           `55P03`, which the action boundary raises as the retryable `TransactionConflictError`; a wait is bounded by
 *           `TransactionOptions.lockTimeout`.
 * Runtime: node
 * Governing contract: STA-1239 (row lock); data-layer gap mo6 (P1 part, stackra-279).
 */

/** The row-lock options. */
export interface LockOptions {
  /** `select ... for share`: other readers may lock the row too, writers wait. */
  readonly shared?: boolean;

  /** Fail at once when another transaction holds the row, instead of waiting. */
  readonly nowait?: boolean;

  /** Skip rows another transaction holds and lock the first free match; `lock` returns null when none is free. */
  readonly skipLocked?: boolean;
}
