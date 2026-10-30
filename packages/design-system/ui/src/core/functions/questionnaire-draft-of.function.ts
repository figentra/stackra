/**
 * Stackra file contract:
 * Purpose: `questionnaireDraftOf`, the editable draft of a reported answer: a value that is none of the question's
 *          options is its "Other" text (the first one, for a `multiple` question).
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import type { QuestionnaireDraft } from "#core/types/questionnaire-draft.type";

/** The draft `answer` starts the question from. */
export function questionnaireDraftOf(
  question: QuestionnaireQuestion,
  answer: string | readonly string[] | undefined,
): QuestionnaireDraft {
  const list = answer === undefined ? [] : typeof answer === "string" ? [answer] : answer;
  if (question.kind === "text") return { values: list.slice(0, 1), other: null };
  const known = new Set((question.options ?? []).map((option) => option.value));
  const values = list.filter((value) => known.has(value));
  const unknown = list.find((value) => !known.has(value));
  return {
    values: question.kind === "single" ? values.slice(0, 1) : values,
    other: question.allowsOther && unknown !== undefined ? unknown : null,
  };
}
