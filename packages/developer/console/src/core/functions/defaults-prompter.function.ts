/**
 * Stackra file contract:
 * Purpose: `defaultsPrompter()`, the prompter of a run that may not prompt (no terminal, CI, `--no-interaction`,
 *          `--json`): each prompt takes its default, and a prompt without one fails naming the option that answers it.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-023.
 */
import type { Prompter } from "#contracts/types/prompter.type";
import { NonInteractivePromptError } from "#core/errors/non-interactive-prompt.error";

/** Answers every prompt with its default. */
export function defaultsPrompter(): Prompter {
  return {
    ask: async (request) => {
      if (request.default !== undefined) return request.default;
      if (request.kind === "multiselect") return [];
      throw new NonInteractivePromptError(request.message, request.option);
    },
  };
}
