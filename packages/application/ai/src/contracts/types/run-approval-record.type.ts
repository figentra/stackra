/**
 * Stackra file contract:
 * Purpose: `RunApprovalRecord`, an approval a run's tool call was parked on: the approval id, the run, the tool call,
 *          the action, and where it stands.
 * Boundary: a type only, written through the `RunStore` (one row per approval id, updated as it resolves). The request
 *           itself lives in the tasks-approvals service; this is the run's view of it.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 5 and 10: `ai_approvals`).
 */
import type { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";

/** One approval in a run. */
export interface RunApprovalRecord {
  /** The parked request's id, from the approval gate. */
  readonly approvalId: string;

  /** The run. */
  readonly runId: string;

  /** The parked tool call. */
  readonly toolCallId: string;

  /** The action key it dispatches. */
  readonly tool: string;

  /** Where it stands. */
  readonly status: RunApprovalStatus;

  /** When it reached this status. */
  readonly at: Date;
}
