/**
 * Stackra file contract:
 * Purpose: `PromptRequest`, one question a command asks: its kind, message, default, choices and validation, and the
 *          option that answers it when the run is not interactive.
 * Boundary: a type only; every prompter (interactive, defaults, scripted) answers the same request.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-023, FR-024 and FR-027.
 */
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { PromptChoice } from "#contracts/types/prompt-choice.type";
import type { PromptKind } from "#contracts/types/prompt-kind.type";

/** A question for the Operator. */
export interface PromptRequest {
  /** How it is asked. */
  readonly kind: PromptKind;

  /** The question the Operator reads. */
  readonly message: string;

  /** The answer used without asking when the run is not interactive, and preselected when it is. */
  readonly default?: PromptAnswer;

  /** A dim example shown in an empty text field. */
  readonly placeholder?: string;

  /** The choices of `select`, `multiselect` and `search`. */
  readonly choices?: readonly PromptChoice[];

  /** A message when a text answer is refused, else undefined; the prompt stays open until it passes. */
  readonly validate?: (answer: string) => string | undefined;

  /** The option that answers this prompt, named in the error when a non-interactive run has no default. */
  readonly option?: string;
}
