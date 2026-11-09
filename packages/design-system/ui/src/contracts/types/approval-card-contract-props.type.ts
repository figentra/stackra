/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ApprovalCard` takes: what will run, its input, its risk, where the approval
 *          stands, and Approve and Deny.
 * Boundary: types only; nothing runs until the person approves (ADR 0021). The card sends nothing itself: the host
 *           answers the run with what `onApprove` or `onDeny` tells it.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0021 (a write waits for a person).
 */
import type { ApprovalCardStatus } from "#contracts/enums/approval-card-status.enum";
import type { ApprovalCardField } from "#contracts/types/approval-card-field.type";

/** Props shared by the web and native `ApprovalCard`. */
export interface ApprovalCardContractProps {
  /** What will run, for example the action's label; defaults to "Tamo wants to run this". */
  readonly title?: string | undefined;
  /** The call's input, in order. */
  readonly fields: readonly ApprovalCardField[];
  /** A short risk level, for example "L3"; left out, no risk is shown. */
  readonly risk?: string | undefined;
  /** Where the approval stands: only `requested` shows Approve and Deny. */
  readonly status: ApprovalCardStatus;
  /** Called when the person approves the call. */
  readonly onApprove: () => void;
  /** Called when the person denies the call. */
  readonly onDeny: () => void;
  /** True while the answer is being sent: Approve and Deny are disabled. */
  readonly isPending?: boolean | undefined;
  /** Why the call was denied, shown under a denied status. */
  readonly reason?: string | undefined;
}
