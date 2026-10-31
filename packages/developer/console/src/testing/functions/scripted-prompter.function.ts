/**
 * Stackra file contract:
 * Purpose: `scriptedPrompter(answers)`, a prompter that answers each prompt with the next scripted answer, runs a
 *          text answer through the prompt's `validate`, and fails naming the prompt when the script runs out.
 * Boundary: no I/O; records the questions asked for the test to read.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-027 and FR-028; spec 030 Requirement 8.
 */
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { Prompter } from "#contracts/types/prompter.type";

/** A prompter over `answers`, and the questions it was asked. */
export function scriptedPrompter(
  answers: readonly PromptAnswer[],
): Prompter & { readonly asked: string[] } {
  const queue = [...answers];
  const asked: string[] = [];
  return {
    asked,
    ask: async (request) => {
      asked.push(request.message);
      if (queue.length === 0)
        throw new Error(`No scripted answer is left for "${request.message}"`);
      const answer = queue.shift() as PromptAnswer;
      const refused = typeof answer === "string" ? request.validate?.(answer) : undefined;
      if (refused !== undefined)
        throw new Error(`The scripted answer to "${request.message}" is refused: ${refused}`);
      return answer;
    },
  };
}
