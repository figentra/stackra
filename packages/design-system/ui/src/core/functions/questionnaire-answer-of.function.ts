/**
 * Stackra file contract:
 * Purpose: `questionnaireAnswerOf`, the answer a draft reports, or `undefined` while it holds none (nothing chosen,
 *          blank text, or "Other" chosen with blank text): a `single` question reports the option's value or the
 *          "Other" text, a `multiple` one the values with the "Other" text last, a `text` one the text.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import type { QuestionnaireDraft } from "#core/types/questionnaire-draft.type";

/** The reported answer of `draft`, or `undefined` when it holds none. */
export function questionnaireAnswerOf(
  question: QuestionnaireQuestion,
  draft: QuestionnaireDraft,
): string | readonly string[] | undefined {
  const other = draft.other?.trim() ? draft.other.trim() : undefined;
  if (question.kind === "multiple") {
    const list = other === undefined ? draft.values : [...draft.values, other];
    return list.length > 0 ? list : undefined;
  }
  if (question.kind === "single" && draft.other !== null) return other;
  const value = draft.values[0];
  return value?.trim() ? value : undefined;
}
