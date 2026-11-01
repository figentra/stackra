/**
 * Stackra file contract:
 * Purpose: `visibleChoices(state)`, the choices a prompt shows: all of them, or for `search` those whose label or
 *          value contains the typed text, ignoring case.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */
import type { PromptChoice } from "#contracts/types/prompt-choice.type";
import type { PromptState } from "#core/types/prompt-state.type";

/** The choices shown in `state`. */
export function visibleChoices(state: PromptState): readonly PromptChoice[] {
  const choices = state.request.choices ?? [];
  if (state.request.kind !== "search" || state.text === "") return choices;
  const needle = state.text.toLocaleLowerCase();
  return choices.filter((choice) =>
    `${choice.label ?? ""} ${choice.value}`.toLocaleLowerCase().includes(needle),
  );
}
