/**
 * Stackra file contract:
 * Purpose: the web `ApprovalCard`: an agent's tool call waiting for a human, on HeroUI Pro's ChatTool through this
 *          package's wrapper: the request as the trigger, the summary and the input under it, who must approve, and
 *          the reject, escalate and approve buttons while it is pending.
 * Boundary: shows and reports only; the handlers are the caller's (the ai gateway's approval endpoints). Opened by
 *           default while pending, so the request is visible without a click; after a decision the buttons go and the
 *           row shows the outcome's state.
 * Runtime: browser
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0100 (decision 5); ADR 0310 (decision 3).
 */
import { Button } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { ApprovalCardContractProps } from "#contracts/types/approval-card-contract-props.type";
import { ChatTool, type ToolPartState } from "#react/chat-tool/chat-tool";

/** Props of the web ApprovalCard. */
export type ApprovalCardProps = ApprovalCardContractProps;

/** The ChatTool state each approval status draws as. */
const STATE: Readonly<Record<ApprovalCardProps["status"], ToolPartState>> = Object.freeze({
  pending: "requires-action",
  approved: "output-available",
  rejected: "output-error",
  escalated: "input-available",
});

/** A tool call waiting for, or decided by, a human. */
export function ApprovalCard({
  title,
  summary,
  input,
  inputLabel,
  approver,
  status,
  onApprove,
  onReject,
  onEscalate,
  approveLabel,
  rejectLabel,
  escalateLabel,
}: ApprovalCardProps): ReactElement {
  return (
    <ChatTool
      data-approval-status={status}
      state={STATE[status]}
      isActive={false}
      defaultExpanded={status === "pending"}
    >
      <ChatTool.Trigger>
        <ChatTool.StatusIcon />
        {title}
      </ChatTool.Trigger>
      <ChatTool.Content>
        {summary == null ? null : <p className="text-sm">{summary}</p>}
        {input === undefined ? null : <ChatTool.Args input={input} label={inputLabel} />}
        <ChatTool.Approval>
          {approver == null ? null : <p className="text-sm text-muted">{approver}</p>}
          <ChatTool.ApprovalActions>
            <ChatTool.Reject onPress={onReject}>{rejectLabel}</ChatTool.Reject>
            {onEscalate === undefined ? null : (
              <Button size="sm" variant="ghost" onPress={onEscalate}>
                {escalateLabel}
              </Button>
            )}
            <ChatTool.Approve onPress={onApprove}>{approveLabel}</ChatTool.Approve>
          </ChatTool.ApprovalActions>
        </ChatTool.Approval>
      </ChatTool.Content>
    </ChatTool>
  );
}
