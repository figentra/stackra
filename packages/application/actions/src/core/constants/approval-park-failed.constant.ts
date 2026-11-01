/**
 * Stackra file contract:
 * Purpose: `APPROVAL_PARK_FAILED`, the log event the pipeline writes when the binding insert or the park of an approval
 *          request failed after the call was refused `approval_required`.
 * Boundary: a constant. The line carries the approval id, the action key and the error code only, never the draft or the
 *           input (C3).
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (park failures log no input); STA-1724 FR-006.
 */

/** The log event of a failed park. */
export const APPROVAL_PARK_FAILED = "actions.approval_park_failed";
