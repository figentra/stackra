/**
 * Stackra file contract:
 * Purpose: `ApprovalDecision`, what `resolveApproval` answers for one tool call: refused, run at once, wait for the
 *          user's confirmation or a named approver, or escalate to another human; with the step and mode that decided.
 * Boundary: a type only. `escalate` hands the approval (and the work, when the requester lacks the permission) to
 *           another human through the tasks and approvals service; it never lends the approver's authority.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0100 (decision 5).
 */
import type { Approval } from "#core/enums/approval.enum";
import type { ApprovalMode } from "#core/enums/approval-mode.enum";
import type { ApprovalStep } from "#core/types/approval-step.type";

/** The resolver's answer. */
export interface ApprovalDecision {
  /** `refused`, `run`, `escalate`, or the approval the call waits for (`confirm`, `named_approver`). */
  readonly outcome: "refused" | "run" | "escalate" | Approval;

  /** The step of the fixed order that decided. */
  readonly step: ApprovalStep;

  /** The approval mode that decided, when a mode did. */
  readonly mode?: ApprovalMode;
}
