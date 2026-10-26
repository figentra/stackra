/**
 * Stackra file contract:
 * Purpose: `RunApprovalStatus`, where a parked tool call's approval stands within its run: pending, granted or denied.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231), stored in `ai.approvals.status`. The decision itself is
 *           the tasks-approvals service's; the run records what it was told when it resumed.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 5 and 10: `ai_approvals`); ADR 0098 (decision 3).
 */
import { Enum } from "@stackra/contracts";

/**
 * An approval's status in a run.
 *
 * @example
 * await runs.recordApproval({ ...parked, status: RunApprovalStatus.Granted });
 */
export const RunApprovalStatus = Enum.of({
  /** Waiting for the approver. */
  Pending: "pending",
  /** Granted; the tool call ran again with the approval id. */
  Granted: "granted",
  /** Denied; the model was told the call was not executed. */
  Denied: "denied",
});

/** One of the codes above. */
export type RunApprovalStatus = Enum.Value<typeof RunApprovalStatus>;
