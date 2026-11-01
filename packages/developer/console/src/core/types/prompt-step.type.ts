/**
 * Stackra file contract:
 * Purpose: `PromptStep`, what one key press does to a prompt: a new state, an answer, or a cancel.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024 and FR-025.
 */
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { PromptState } from "#core/types/prompt-state.type";

/** The result of a key press. */
export type PromptStep =
  | { readonly state: PromptState }
  | { readonly answer: PromptAnswer }
  | { readonly cancelled: true };
