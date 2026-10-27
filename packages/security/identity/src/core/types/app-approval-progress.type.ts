/**
 * Stackra file contract:
 * Purpose: `AppApprovalProgress`, all a requester learns while it waits: still pending, approved, or ended.
 * Boundary: a type only. `ended` covers denied, lapsed, replaced, completed, unknown and an account that does not
 *           exist, so the waiting screen never tells them apart.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */

/** The requester's view of a challenge. */
export type AppApprovalProgress = "pending" | "approved" | "ended";
