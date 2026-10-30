/**
 * Stackra file contract:
 * Purpose: `ToolCallOutcome`, how one tool call of an agent run ended: applied, refused, parked for an approval, or
 *          proposed as a draft, or handed to
 *          the viewer's screen as a client tool call.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231), stored in `ai.tool_calls.outcome`. The outcome is the
 *           action pipeline's answer, never the model's.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 3 and 10: every tool call is an action dispatch; `ai_tool_calls`); R3-SO-02;
 *                     ADR 0490 (decision 4).
 */
import { Enum } from "@stackra/contracts";

/**
 * A tool call's outcome.
 *
 * @example
 * await runs.recordToolCall({ ...call, outcome: ToolCallOutcome.ApprovalRequired, approvalId });
 */
export const ToolCallOutcome = Enum.of({
  /** The action ran and answered. */
  Ok: "ok",
  /** A step of the pipeline refused it. */
  Refused: "refused",
  /** The approval gate parked it. */
  ApprovalRequired: "approval_required",
  /** It ran in propose mode: a draft, no effects. */
  Proposed: "proposed",
  /** It is a client tool call: the run parked and the viewer's screen runs it; never an action dispatch. */
  ClientTool: "client_tool",
});

/** One of the codes above. */
export type ToolCallOutcome = Enum.Value<typeof ToolCallOutcome>;
