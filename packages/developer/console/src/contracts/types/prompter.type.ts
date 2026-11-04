/**
 * Stackra file contract:
 * Purpose: `Prompter`, what answers a `PromptRequest`: the terminal prompter in `./node`, the defaults prompter of a
 *          non-interactive run, the scripted prompter in `./testing`.
 * Boundary: a type only. A prompter throws `PromptCancelledError` when the Operator cancels.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-023 to FR-025.
 */
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { PromptRequest } from "#contracts/types/prompt-request.type";

/** Asks the Operator a prompt and returns the answer. */
export interface Prompter {
  /** Asks `request` and resolves with the answer. */
  readonly ask: (request: PromptRequest) => Promise<PromptAnswer>;
}
