/**
 * Stackra file contract:
 * Purpose: `renderPrompt(state, paint)`, the frame of an open prompt: an accent bar with the question, the field or
 *          the choices (pointer, ticks, hints), and a closing line with the validation message or a key hint. A
 *          password shows one bullet per character, never the characters.
 * Boundary: pure; returns the lines. At most 8 choices are shown, scrolled around the cursor.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024 and FR-026.
 */
import { isolateBidi } from "#core/functions/isolate-bidi.function";
import { visibleChoices } from "#core/functions/visible-choices.function";
import type { PromptPaint } from "#core/types/prompt-paint.type";
import type { PromptState } from "#core/types/prompt-state.type";

/** The most choices shown at once. */
const WINDOW = 8;

/** The lines of `state`. */
export function renderPrompt(state: PromptState, paint: PromptPaint): string[] {
  const { painter, symbols } = paint;
  const { request } = state;
  const bar = painter.accent(symbols.bar);
  const lines = [`  ${painter.accent(symbols.info)} ${painter.bold(isolateBidi(request.message))}`];
  if (request.kind === "text" || request.kind === "password" || request.kind === "search") {
    const shown =
      request.kind === "password"
        ? symbols.bullet.repeat([...state.text].length)
        : isolateBidi(state.text);
    const empty =
      state.text === ""
        ? painter.dim(
            request.placeholder ?? (typeof request.default === "string" ? request.default : ""),
          )
        : "";
    lines.push(`  ${bar} ${shown}${empty}${painter.accent("_")}`);
  }
  if (request.kind === "confirm") {
    const option = (label: string, on: boolean) =>
      on ? painter.accent(`${symbols.pointer} ${label}`) : painter.dim(`  ${label}`);
    lines.push(
      `  ${bar} ${option("Yes", state.cursor === 0)}  ${option("No", state.cursor === 1)}`,
    );
  }
  if (request.kind === "select" || request.kind === "multiselect" || request.kind === "search") {
    const choices = visibleChoices(state);
    const start = Math.min(
      Math.max(0, state.cursor - WINDOW + 1),
      Math.max(0, choices.length - WINDOW),
    );
    choices.slice(start, start + WINDOW).forEach((choice, offset) => {
      const index = start + offset;
      const on = index === state.cursor;
      const tick =
        request.kind === "multiselect"
          ? `${state.ticked.includes(choice.value) ? painter.accent(symbols.checked) : symbols.unchecked} `
          : "";
      const label = isolateBidi(choice.label ?? choice.value);
      const hint = choice.hint === undefined ? "" : ` ${painter.dim(choice.hint)}`;
      lines.push(
        `  ${bar} ${on ? painter.accent(symbols.pointer) : " "} ${tick}${on ? painter.accent(label) : label}${hint}`,
      );
    });
    if (choices.length === 0) lines.push(`  ${bar} ${painter.dim("Nothing matches")}`);
  }
  const hint =
    request.kind === "multiselect"
      ? "space to tick, enter to submit"
      : request.kind === "confirm"
        ? "y or n, enter to submit"
        : "enter to submit";
  lines.push(
    `  ${painter.accent(symbols.corner)} ${state.error === undefined ? painter.dim(hint) : painter.error(state.error)}`,
  );
  return lines;
}
