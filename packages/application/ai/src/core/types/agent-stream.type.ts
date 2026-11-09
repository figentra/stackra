/**
 * Stackra file contract:
 * Purpose: `AgentStream`, what `stream` answers at once: the run and conversation, the model's text as it arrives,
 *          the same answer as AI SDK UI message chunks, and the reply once the run settles (stored, parked or failed).
 * Boundary: a type only. Read `textStream` or `uiStream` to the end, or await `reply`, so the run settles; all share
 *           one model call. `uiStream` holds what the reply holds: the tool outputs the model saw, never the
 *           instructions, and a parked call as a `tool-approval-request` chunk with the run's approval id.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2: `stream`); STA-781; STA-2608.
 */
import type { UIMessageChunk } from "ai";

import type { AgentReply } from "#core/types/agent-reply.type";

/** A streaming run. */
export interface AgentStream {
  /** The run being streamed. */
  readonly runId: string;

  /** The conversation the run belongs to. */
  readonly conversationId: string;

  /** The model's text deltas. */
  readonly textStream: AsyncIterable<string>;

  /** The AI SDK v7 UI message chunks, `start` (message id: the run id) to `finish`, or `abort` when aborted. */
  readonly uiStream: ReadableStream<UIMessageChunk>;

  /** The settled reply. */
  readonly reply: Promise<AgentReply>;
}
