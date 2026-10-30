/**
 * Stackra file contract:
 * Purpose: `ClientToolPart`, the `client_tool` part a run emits on its stream when the model calls a client tool: the
 *          run, the tool call, the surface it is for, the tool and its input, and when the wait ends.
 * Boundary: a type only. Sent to the one surface that opened the turn, never to another; the surface runs the
 *           generated handler and answers with `ai.run.client_result` (ADR 0490 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); STA-1631.
 */
import type { Json } from "@stackra/contracts";

/** A client tool call, as the surface receives it. */
export interface ClientToolPart {
  /** The part's discriminator on the run's stream. */
  readonly type: "client_tool";

  /** The run that is waiting. */
  readonly runId: string;

  /** The model's tool call id; the answer names it. */
  readonly toolCallId: string;

  /** The surface this is for. */
  readonly surfaceId: string;

  /** The client tool's key. */
  readonly tool: string;

  /** The model's input, as the tool's input schema describes it. */
  readonly input: Json;

  /** When the run stops waiting and the model is told `client_unavailable`, ISO 8601. */
  readonly expiresAt: string;
}
