/**
 * Stackra file contract:
 * Purpose: `renderAnswer(request, answer, paint)`, the one line an answered prompt collapses to: the question and the
 *          answer, dimmed; a password answer is never shown.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { PromptRequest } from "#contracts/types/prompt-request.type";
import type { PromptPaint } from "#core/types/prompt-paint.type";

/** The answered line of `request`. */
export function renderAnswer(
  request: PromptRequest,
  answer: PromptAnswer,
  paint: PromptPaint,
): string {
  const shown =
    request.kind === "password"
      ? paint.symbols.bullet.repeat(4)
      : typeof answer === "boolean"
        ? answer
          ? "Yes"
          : "No"
        : Array.isArray(answer)
          ? answer.join(", ")
          : (request.choices?.find((choice) => choice.value === answer)?.label ?? String(answer));
  return `  ${paint.painter.success(paint.symbols.success)} ${request.message} ${paint.painter.dim(shown)}`;
}
