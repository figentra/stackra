/**
 * Stackra file contract:
 * Purpose: where an agent's tool call stands in an `ApprovalCard`: waiting for a human, approved, rejected, or escalated
 *          to another human.
 * Boundary: the values only; the approval itself is the ai service's and the tasks and approvals service's.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0100 (decision 5).
 */

/** The states of an approval. */
// shortcut: a frozen tuple, as the @stackra/ui contracts' enums are, until Enum.of reaches the contracts (ADR 0128).
export const ApprovalStatus = Object.freeze([
  "pending",
  "approved",
  "rejected",
  "escalated",
] as const);

/** One approval state. */
export type ApprovalStatus = (typeof ApprovalStatus)[number];
