/**
 * Stackra file contract:
 * Purpose: `DiffDecision`, the reviewer's answer per change id: accepted or rejected; a missing id is still pending.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** Change id to the reviewer's decision. */
export type DiffDecision = Readonly<Record<string, "accepted" | "rejected">>;
