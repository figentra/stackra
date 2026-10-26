/**
 * Stackra file contract:
 * Purpose: `PromptCall`, what a caller hands `prompt`, `stream` and `queue` beside the text: the acting agent
 *          principal, the conversation to continue, where the run acts, the record it works in, the locale of the
 *          instructions and an abort signal.
 * Boundary: a type only. The actor is an agent principal whose `onBehalfOf` names the human (ADR 0100 decision 3),
 *           built by the caller from the verified session, never from input; a conversation of another principal is
 *           refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 to 4); ADR 0327 (decision 6: the scope); STA-781.
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { RecordScope } from "#contracts/types/record-scope.type";

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

  /** Stops the model loop. */
  readonly abortSignal?: AbortSignal;
}
