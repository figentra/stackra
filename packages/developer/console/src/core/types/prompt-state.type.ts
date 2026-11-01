/**
 * Stackra file contract:
 * Purpose: `PromptState`, an open prompt between key presses: the request, the typed text, the highlighted choice,
 *          the ticked choices and the validation message.
 * Boundary: a type only; `stepPrompt` makes the next state and `renderPrompt` draws it.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */
import type { PromptRequest } from "#contracts/types/prompt-request.type";

/** A prompt in progress. */
export interface PromptState {
  /** The question. */
  readonly request: PromptRequest;

  /** The typed text (text, password, search filter). */
  readonly text: string;

  /** The highlighted choice among the visible ones; for confirm, 0 is yes and 1 is no. */
  readonly cursor: number;

  /** The ticked values of a multiselect. */
  readonly ticked: readonly string[];

  /** Why the last answer was refused. */
  readonly error?: string;
}
