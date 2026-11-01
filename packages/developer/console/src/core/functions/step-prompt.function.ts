/**
 * Stackra file contract:
 * Purpose: `stepPrompt(state, key)`, what one key press does: type and erase text, move through choices, tick a
 *          multiselect choice, toggle confirm, submit (refused while `validate` fails), or cancel on Ctrl-C or Escape.
 * Boundary: pure; the terminal prompter in `./node` feeds it keys and draws its states.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024 and FR-025.
 */
import { visibleChoices } from "#core/functions/visible-choices.function";
import type { PromptKey } from "#core/types/prompt-key.type";
import type { PromptState } from "#core/types/prompt-state.type";
import type { PromptStep } from "#core/types/prompt-step.type";

/** `state` with new text, the cursor back on the first match and the old error gone. */
function typing({ request, ticked }: PromptState, text: string): PromptState {
  return { request, ticked, text, cursor: 0 };
}

/** The next step of `state` after `key`. */
export function stepPrompt(state: PromptState, key: PromptKey): PromptStep {
  const { kind } = state.request;
  if ((key.ctrl === true && key.name === "c") || key.name === "escape") return { cancelled: true };
  const choices = visibleChoices(state);
  const move = (delta: number) => ({
    state: {
      ...state,
      cursor: choices.length === 0 ? 0 : (state.cursor + delta + choices.length) % choices.length,
    },
  });

  if (key.name === "return" || key.name === "enter") {
    if (kind === "confirm") return { answer: state.cursor === 0 };
    if (kind === "multiselect") return { answer: state.ticked };
    if (kind === "select" || kind === "search") {
      const choice = choices[state.cursor];
      return choice === undefined
        ? { state: { ...state, error: "Nothing matches" } }
        : { answer: choice.value };
    }
    const answer =
      state.text === "" && typeof state.request.default === "string"
        ? state.request.default
        : state.text;
    const error = state.request.validate?.(answer);
    return error === undefined ? { answer } : { state: { ...state, error } };
  }

  if (kind === "confirm") {
    if (key.name === "y") return { state: { ...state, cursor: 0 } };
    if (key.name === "n") return { state: { ...state, cursor: 1 } };
    if (["left", "right", "up", "down", "tab", "space"].includes(key.name ?? ""))
      return { state: { ...state, cursor: 1 - state.cursor } };
    return { state };
  }
  if (kind === "select" || kind === "multiselect" || kind === "search") {
    if (key.name === "up") return move(-1);
    if (key.name === "down" || key.name === "tab") return move(1);
    if (kind === "multiselect" && key.name === "space") {
      const value = choices[state.cursor]?.value;
      if (value === undefined) return { state };
      const ticked = state.ticked.includes(value)
        ? state.ticked.filter((item) => item !== value)
        : [...state.ticked, value];
      return { state: { ...state, ticked } };
    }
    if (kind !== "search") return { state };
  }
  if (key.name === "backspace")
    return { state: typing(state, [...state.text].slice(0, -1).join("")) };
  const typed = key.sequence ?? "";
  // oxlint-disable-next-line no-control-regex -- reason: only printable text is typed into the field
  if (typed === "" || key.ctrl === true || /[\u0000-\u001F\u007F]/.test(typed)) return { state };
  return { state: typing(state, state.text + typed) };
}
