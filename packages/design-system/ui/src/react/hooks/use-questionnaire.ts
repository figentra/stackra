/**
 * Stackra file contract:
 * Purpose: `useQuestionnaire`, the QuestionnaireCard's behaviour shared by web and native: which step is shown (a
 *          question, or the summary after the last), each question's draft, the radio or checkbox value with "Other"
 *          folded in, and the moves: next, back, skip (which clears the answer), edit from the summary (whose next
 *          returns to the summary) and the answers to send.
 * Boundary: no drawing. Drafts start from `defaultAnswers`; `questionnaireDraftOf` and `questionnaireAnswerOf` convert.
 * Runtime: isomorphic
 * Governing contract: ADR 0004 §1 (`native/` may import `#react/hooks/*`); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useState } from "react";

import type { QuestionnaireAnswers } from "#contracts/types/questionnaire-answers.type";
import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import { QUESTIONNAIRE_OTHER_VALUE } from "#core/constants/questionnaire-other-value.constant";
import { questionnaireAnswerOf } from "#core/functions/questionnaire-answer-of.function";
import { questionnaireDraftOf } from "#core/functions/questionnaire-draft-of.function";
import type { QuestionnaireDraft } from "#core/types/questionnaire-draft.type";

/** Steps through a questionnaire. */
export function useQuestionnaire(
  questions: readonly QuestionnaireQuestion[],
  defaultAnswers: QuestionnaireAnswers | undefined,
): {
  readonly step: number;
  readonly total: number;
  readonly question: QuestionnaireQuestion | undefined;
  readonly isSummary: boolean;
  readonly isLast: boolean;
  readonly draft: QuestionnaireDraft;
  readonly hasAnswer: boolean;
  readonly choice: string | readonly string[];
  readonly setChoice: (value: string | readonly string[]) => void;
  readonly setText: (text: string) => void;
  readonly setOther: (text: string) => void;
  readonly next: () => void;
  readonly back: () => void;
  readonly skip: () => void;
  readonly edit: (index: number) => void;
  readonly answerOf: (question: QuestionnaireQuestion) => string | readonly string[] | undefined;
  readonly answers: () => QuestionnaireAnswers;
} {
  const [step, setStep] = useState(0);
  const [isEditing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Readonly<Record<string, QuestionnaireDraft>>>(() =>
    Object.fromEntries(
      questions.map((question) => [
        question.id,
        questionnaireDraftOf(question, defaultAnswers?.[question.id]),
      ]),
    ),
  );
  const total = questions.length;
  const question = questions[step];
  const draft = (question && drafts[question.id]) ?? { values: [], other: null };
  const answerOf = (of: QuestionnaireQuestion) =>
    questionnaireAnswerOf(of, drafts[of.id] ?? { values: [], other: null });

  const setDraft = (next: QuestionnaireDraft) => {
    if (question) setDrafts((all) => ({ ...all, [question.id]: next }));
  };
  const go = (to: number) => {
    setStep(to);
    if (to >= total) setEditing(false);
  };

  return {
    step,
    total,
    question,
    isSummary: step >= total,
    isLast: step === total - 1 || isEditing,
    draft,
    hasAnswer: question ? answerOf(question) !== undefined : true,
    /** The radio group's value (`""` for none) or the checkbox group's values, "Other" included. */
    choice:
      question?.kind === "multiple"
        ? [...draft.values, ...(draft.other === null ? [] : [QUESTIONNAIRE_OTHER_VALUE])]
        : draft.other === null
          ? (draft.values[0] ?? "")
          : QUESTIONNAIRE_OTHER_VALUE,
    setChoice: (value: string | readonly string[]) => {
      const list = typeof value === "string" ? [value] : value;
      const isOther = list.includes(QUESTIONNAIRE_OTHER_VALUE);
      setDraft({
        values: list.filter((item) => item !== QUESTIONNAIRE_OTHER_VALUE),
        other: isOther ? (draft.other ?? "") : null,
      });
    },
    setText: (text: string) => setDraft({ values: [text], other: null }),
    setOther: (text: string) => setDraft({ ...draft, other: text }),
    next: () => go(isEditing ? total : step + 1),
    back: () => go(Math.max(0, step - 1)),
    skip: () => {
      setDraft({ values: [], other: null });
      go(isEditing ? total : step + 1);
    },
    edit: (index: number) => {
      setEditing(true);
      setStep(index);
    },
    answerOf,
    answers: (): QuestionnaireAnswers =>
      Object.fromEntries(
        questions.flatMap((of) => {
          const answer = answerOf(of);
          return answer === undefined ? [] : [[of.id, answer]];
        }),
      ),
  };
}
