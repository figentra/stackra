/**
 * Stackra file contract:
 * Purpose: `AFTER_COMMIT_FAILED`, the log event the pipeline writes when work an action queued with `ctx.afterCommit`
 *          throws after its transaction committed.
 * Boundary: a log event code; the call has already succeeded, so the failure is logged with the call's key and id and
 *           never fails the call (a retry would replay the stored result, not rerun the work).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 2: external calls after commit); ADR 0147 (structured log events).
 */

/** The log event of a failed after-commit callback. */
export const AFTER_COMMIT_FAILED = "actions.after_commit_failed";
