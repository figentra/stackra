/**
 * Stackra file contract:
 * Purpose: `openPrompt(request)`, the first state of a prompt: the cursor on the default choice, a multiselect's
 *          defaults ticked, confirm on its default (yes when none).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */
import type { PromptRequest } from "#contracts/types/prompt-request.type";
import type { PromptState } from "#core/types/prompt-state.type";

/** The opening state of `request`. */
export function openPrompt(request: PromptRequest): PromptState {
  const choices = request.choices ?? [];
  const fallback = request.default;
  const cursor =
    request.kind === "confirm"
      ? fallback === false
        ? 1
        : 0
      : Math.max(
          0,
          choices.findIndex((choice) => choice.value === fallback),
        );
  return {
    request,
    text: "",
    cursor,
    ticked:
      request.kind === "multiselect" && Array.isArray(fallback)
        ? [...(fallback as readonly string[])]
        : [],
  };
}
