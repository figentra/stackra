/**
 * Stackra file contract:
 * Purpose: `IDEMPOTENCY_STORE_FAILED`, the log event the pipeline writes when the idempotency store fails to record a
 *          call's outcome: the completion after a commit (a store that cannot join the transaction), or the refusal or
 *          the release after a failed call.
 * Boundary: a log event code with the call's key, id, the `step` that failed (`complete`, `complete_refused`,
 *           `release`) and the cause. It never changes the call's answer: a committed call still returns its output
 *           and its key stays held for the replay window (extended right before the commit), never freed, so a retry
 *           cannot repeat the write (STA-2797).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); ADR 0147 (structured log events); ADR 0495 (note of 2026-11-26).
 */

/** The log event of an idempotency store write that failed. */
export const IDEMPOTENCY_STORE_FAILED = "actions.idempotency_store_failed";
