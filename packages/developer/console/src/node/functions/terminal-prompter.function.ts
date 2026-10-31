/**
 * Stackra file contract:
 * Purpose: `terminalPrompter(input, output)`, the interactive prompter: reads key presses in raw mode, steps the
 *          prompt with `stepPrompt`, redraws its frame in place, collapses it to one answered line, and restores the
 *          terminal (raw mode, cursor, listeners) on every exit: answer, cancel or error.
 * Boundary: the only code that puts the terminal in raw mode. A password's characters are never written.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-024 and FR-025.
 */
import { emitKeypressEvents } from "node:readline";

import type { Prompter } from "#contracts/types/prompter.type";
import { PromptCancelledError } from "#core/errors/prompt-cancelled.error";
import { openPrompt } from "#core/functions/open-prompt.function";
import { renderAnswer } from "#core/functions/render-answer.function";
import { renderPrompt } from "#core/functions/render-prompt.function";
import { stepPrompt } from "#core/functions/step-prompt.function";
import type { PromptKey } from "#core/types/prompt-key.type";
import type { PromptPaint } from "#core/types/prompt-paint.type";

/** Moves the cursor up `count` lines and clears to the end of the screen. */
const rewind = (count: number) => (count === 0 ? "" : `\u001B[${count}A\r\u001B[J`);

/** A prompter over `input` and `output`, drawn with `paint`. */
export function terminalPrompter(
  input: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
): (paint: PromptPaint) => Prompter {
  return (paint) => ({
    ask: (request) =>
      new Promise((resolve, reject) => {
        let state = openPrompt(request);
        let drawn = 0;
        const draw = (lines: readonly string[]) => {
          output.write(rewind(drawn) + lines.map((line) => `${line}\n`).join(""));
          drawn = lines.length;
        };
        const raw = input.isRaw;
        const done = () => {
          input.off("keypress", onKey);
          input.setRawMode(raw);
          input.pause();
          output.write("\u001B[?25h");
        };
        const onKey = (_text: string | undefined, key: PromptKey | undefined) => {
          try {
            const step = stepPrompt(state, key ?? {});
            if ("cancelled" in step) {
              draw([`  ${paint.painter.error(paint.symbols.error)} ${request.message}`]);
              done();
              reject(new PromptCancelledError(request.message));
            } else if ("answer" in step) {
              draw([renderAnswer(request, step.answer, paint)]);
              done();
              resolve(step.answer);
            } else {
              state = step.state;
              draw(renderPrompt(state, paint));
            }
          } catch (error) {
            done();
            reject(error);
          }
        };
        emitKeypressEvents(input);
        input.setRawMode(true);
        input.resume();
        input.on("keypress", onKey);
        output.write("\u001B[?25l");
        draw(renderPrompt(state, paint));
      }),
  });
}
