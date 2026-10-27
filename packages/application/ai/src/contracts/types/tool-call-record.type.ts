/**
 * Stackra file contract:
 * Purpose: `ToolCallRecord`, one tool call of a run as recorded: the call id, the action key, a hash of its input,
 *          how it ended, the refusal code and the approval it was parked on.
 * Boundary: a type only, written through the `RunStore`. The input is hashed (SHA-256), never stored (ADR 0100
 *           decision 9); the action's own audit entry and evidence hold what it did.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 3, 9 and 10: `ai_tool_calls`).
 */
import type { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";

/** One recorded tool call. */
export interface ToolCallRecord {
  /** The run that made this tool call. */
  readonly runId: string;

  /** The model's tool call id; with the run id, the action's Idempotency-Key. */
  readonly toolCallId: string;

  /** The action key it dispatched (`orders.order.cancel@1`). */
  readonly tool: string;

  /** The SHA-256 of the input's canonical JSON, hex. */
  readonly inputHash: string;

  /** How it ended. */
  readonly outcome: ToolCallOutcome;

  /** The refusal code of a refused call. */
  readonly code?: string;

  /** The approval a parked call waits for. */
  readonly approvalId?: string;

  /** When it ended. */
  readonly at: Date;
}
