/**
 * Stackra file contract:
 * Purpose: `ClientToolNotPendingError`, the refusal `AgentRuntime` raises when a surface answers a client tool call the
 *          run is not waiting on: an unknown tool call id, or one already answered or expired. A 412, code
 *          `client_tool_not_pending`.
 * Boundary: a refusal; it names the tool call id the surface sent, never a result. The run is left as it was: a late
 *           or repeated answer changes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4: idempotent by `toolCallId`); ADR 0140 (error envelope); ADR 0294
 *                     (decision 20); STA-1631.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The run is not waiting on that client tool call.
 *
 * @example
 * throw ClientToolNotPendingError.create({ toolCallId: "call_1" });
 */
export class ClientToolNotPendingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The tool call id the surface answered. */
  toolCallId!: string;
}
