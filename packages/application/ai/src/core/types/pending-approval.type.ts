/**
 * Stackra file contract:
 * Purpose: `PendingApproval`, the tool call a run is parked on: the approval id the gate gave, the model's tool call
 *          id and the action key, which the caller shows the user and the approver.
 * Boundary: a type only, carried on `AgentReply` while the run waits.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 and 5: approvals surface to the caller, `resume`); STA-781.
 */

/** A parked tool call. */
export interface PendingApproval {
  /** The parked request's id. */
  readonly approvalId: string;

  /** The model's tool call id. */
  readonly toolCallId: string;

  /** The action key it dispatches. */
  readonly tool: string;
}
