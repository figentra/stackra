/**
 * Stackra file contract:
 * Purpose: `createPrompt(prompter)`, the typed `ConsolePrompt` a command uses, over whichever prompter the run has
 *          (terminal, defaults or script), checking each answer has the type its kind promises.
 * Boundary: pure apart from the prompter it calls.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-023, FR-024 and FR-027.
 */
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { PromptKind } from "#contracts/types/prompt-kind.type";
import type { PromptRequest } from "#contracts/types/prompt-request.type";
import type { Prompter } from "#contracts/types/prompter.type";
import type { ConsolePrompt } from "#core/types/console-prompt.type";

/** The typed prompts over `prompter`. */
export function createPrompt(prompter: Prompter): ConsolePrompt {
  const ask = async (
    kind: PromptKind,
    request: Omit<PromptRequest, "kind">,
  ): Promise<PromptAnswer> => prompter.ask({ ...request, kind });
  const text = (kind: PromptKind) => async (request: Omit<PromptRequest, "kind">) => {
    const answer = await ask(kind, request);
    if (typeof answer !== "string") throw new TypeError(`"${request.message}" needs a text answer`);
    return answer;
  };
  return {
    text: text("text"),
    password: text("password"),
    select: text("select"),
    search: text("search"),
    confirm: async (request) => {
      const answer = await ask("confirm", request);
      if (typeof answer === "boolean") return answer;
      if (typeof answer === "string" && /^(y|yes|n|no|true|false)$/i.test(answer))
        return /^(y|yes|true)$/i.test(answer);
      throw new TypeError(`"${request.message}" needs a yes or no answer`);
    },
    multiselect: async (request) => {
      const answer = await ask("multiselect", request);
      if (Array.isArray(answer)) return [...answer] as string[];
      if (typeof answer === "string")
        return answer === "" ? [] : answer.split(",").map((value) => value.trim());
      throw new TypeError(`"${request.message}" needs a list answer`);
    },
  };
}
