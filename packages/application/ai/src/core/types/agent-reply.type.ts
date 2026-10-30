/**
 * Stackra file contract:
 * Purpose: `AgentReply`, how one prompt or resume ended: the run and conversation, the status, the model's final text
 *          and, while waiting, the parked approval or client tool call.
 * Boundary: a type only. The text is also stored in the conversation; a waiting run's text is what the model said
 *           before the parked call.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2); STA-781; ADR 0490 (decision 4).
 */
import type { RunStatus } from "#contracts/enums/run-status.enum";
import type { ClientToolPending } from "#contracts/types/client-tool-pending.type";
import type { PendingApproval } from "#core/types/pending-approval.type";

/** One run's answer. */
export interface AgentReply {
  /** The run that produced the answer. */
  readonly runId: string;

  /** The conversation the run belongs to. */
  readonly conversationId: string;

  /** `completed`, `waiting_approval` or `waiting_client_tool`. */
  readonly status: RunStatus;

  /** The model's final text. */
  readonly text: string;

  /** The parked approval while `waiting_approval`. */
  readonly pending?: PendingApproval;

  /** The parked client tool call while `waiting_client_tool`. */
  readonly clientPending?: ClientToolPending;
}
