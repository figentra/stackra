/**
 * Stackra file contract:
 * Purpose: the props of the `ApprovalCard`: an agent's tool call waiting for a human: what it will do, the input it
 *          will run with, whether it needs the user's confirmation or a named approver, its status, and the approve,
 *          reject and escalate handlers with their labels.
 * Boundary: types only. The card shows and reports; it never runs the action, and an agent never approves its own
 *           call (the gateway routes the approval to a human).
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0100 (decisions 5 and 13); ADR 0310 (decision 3).
 */
import type { ReactNode } from "react";

import type { ApprovalStatus } from "#contracts/enums/approval-status.enum";

/** Props of the `ApprovalCard`. */
export interface ApprovalCardContractProps {
  /** What the agent asks to do, in the app's language (`Refund order #1042`). */
  readonly title: ReactNode;
  /** Why, or what will change. */
  readonly summary?: ReactNode | undefined;
  /** The tool's input, shown as JSON. */
  readonly input?: unknown;
  /** The label above the input. */
  readonly inputLabel?: ReactNode | undefined;
  /** Who must approve, shown for a named approver (`Needs a finance approver`). */
  readonly approver?: ReactNode | undefined;
  /** Where the approval stands; `pending` shows the buttons. */
  readonly status: ApprovalStatus;
  /** Called when the human approves. */
  readonly onApprove: () => void;
  /** Called when the human rejects. */
  readonly onReject: () => void;
  /** Called when the human hands the approval to someone else; no escalate button without it. */
  readonly onEscalate?: (() => void) | undefined;
  /** The approve button's text. */
  readonly approveLabel: ReactNode;
  /** The reject button's text. */
  readonly rejectLabel: ReactNode;
  /** The escalate button's text. */
  readonly escalateLabel?: ReactNode | undefined;
}
