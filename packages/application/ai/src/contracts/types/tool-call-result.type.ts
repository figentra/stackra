/**
 * Stackra file contract:
 * Purpose: `ToolCallResult`, what the `ToolDispatcher` answers for one tool call: the action's output, a refusal code,
 *          the approval it was parked on, or the draft of a proposed call.
 * Boundary: a type only. A bug (a non-refusal error) is not an answer: the dispatcher lets it throw and the run fails.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 3); ADR 0098 (decision 3); R3-SO-02.
 */
import type { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";

/** One tool call's answer. */
export type ToolCallResult =
  | { readonly outcome: typeof ToolCallOutcome.Ok; readonly output: unknown }
  | { readonly outcome: typeof ToolCallOutcome.Refused; readonly code: string }
  | { readonly outcome: typeof ToolCallOutcome.ApprovalRequired; readonly approvalId: string }
  | { readonly outcome: typeof ToolCallOutcome.Proposed; readonly draft: unknown };
