/**
 * Stackra file contract:
 * Purpose: `PromptCall`, what a caller hands `prompt`, `stream` and `queue` beside the text: the acting agent
 *          principal, the conversation to continue, where the run acts, the record it works in, the locale of the
 *          instructions, the session's bypass switch, an abort signal, and the surface
 *          that opened the turn with the client tools it may be offered.
 * Boundary: a type only. The actor is an agent principal whose `onBehalfOf` names the human (ADR 0100 decision 3),
 *           built by the caller from the verified session, never from input; a conversation of another principal is
 *           refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 to 4); ADR 0327 (decision 6: the scope); STA-781; STA-1256 (bypass); ADR 0490 (decisions 3 and
 *                     4: the surface and its client tools); STA-1631.
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { ClientToolPart } from "#contracts/types/client-tool-part.type";
import type { ClientToolRow } from "#contracts/types/client-tool-row.type";
import type { RecordScope } from "#contracts/types/record-scope.type";
import type { SurfaceDescriptor } from "#contracts/types/surface-descriptor.type";

/** The call facts of one prompt. */
export interface PromptCall {
  /** The acting agent principal, with the human in `onBehalfOf`. */
  readonly actor: Actor;

  /** The conversation to continue; a new one opens when absent. */
  readonly conversationId?: string;

  /** The scope node the run acts in; absent for a platform run. */
  readonly scope?: ScopeRef;

  /** The record the run works in (a matter). */
  readonly record?: RecordScope;

  /** The locale of the instructions. */
  readonly locale?: string;

  /** Whether this session is switched to bypass; off when absent. Passed to every tool call; `queue` drops it. */
  readonly bypass?: boolean;

  /** Stops the model loop. */
  readonly abortSignal?: AbortSignal;

  /** The surface that opened the turn; a client tool call goes to it and to no other. Absent for a queued run. */
  readonly surface?: SurfaceDescriptor;

  /** The client tools offered on this turn: `offerClientTools(table, surface, held)`; none when absent. */
  readonly clientTools?: readonly ClientToolRow[];

  /** Receives the `client_tool` part when the run parks on a client tool call, once the park is stored. */
  readonly onClientTool?: (part: ClientToolPart) => void;

  /** How long to wait for the surface's answer, in milliseconds; `CLIENT_TOOL_TIMEOUT_MS` when absent. */
  readonly clientToolTimeoutMs?: number;
}
