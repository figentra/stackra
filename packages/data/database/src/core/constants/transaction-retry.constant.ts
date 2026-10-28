/**
 * Stackra file contract:
 * Purpose: `TRANSACTION_RETRY`, the bounds of `TransactionOptions.retry`: the SQLSTATEs a retry runs the work again
 *          for (serialization failure `40001`, deadlock `40P01`), the most retries a call may ask for, and the jittered
 *          back-off between attempts.
 * Boundary: internal to `runTransaction`. A lock that could not be taken (`55P03`) or a statement timeout (`57014`) is
 *           not retried here: the caller asked not to wait, or waited its budget; the action boundary still raises them
 *           as the retryable `TransactionConflictError`.
 * Runtime: node
 * Governing contract: data-layer gap mo6 (P1 part, stackra-279).
 */

/** The retry bounds of a transaction. */
export const TRANSACTION_RETRY = {
  /** The SQLSTATEs another attempt may get past. */
  states: new Set(["40001", "40P01"]),
  /** The most retries one call may ask for. */
  max: 10,
  /** The first back-off, in milliseconds; each retry doubles it, with full jitter. */
  baseMs: 20,
  /** The longest back-off, in milliseconds. */
  capMs: 1000,
} as const;
