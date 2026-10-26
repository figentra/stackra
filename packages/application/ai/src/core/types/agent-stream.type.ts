/**
 * Stackra file contract:
 * Purpose: `AgentStream`, what `stream` answers at once: the run and conversation, the model's text as it arrives,
 *          and the reply once the run settles (stored, parked or failed).
 * Boundary: a type only. Read `textStream` to the end, or await `reply`, so the run settles; both share one model call.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2: `stream`); STA-781.
 */
import type { AgentReply } from "#core/types/agent-reply.type";

/** A streaming run. */
export interface AgentStream {
  /** The run. */
  readonly runId: string;

  /** The conversation. */
  readonly conversationId: string;

  /** The model's text deltas. */
  readonly textStream: AsyncIterable<string>;

  /** The settled reply. */
  readonly reply: Promise<AgentReply>;
}
