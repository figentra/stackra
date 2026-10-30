/**
 * Stackra file contract:
 * Purpose: how a `QuestionnaireCard` question is answered: one option, several options, or free text.
 * Boundary: the values only; the words of each question are the app's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The kinds of questionnaire question. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of here (ADR 0128); the kinds carry no labels.
export const QuestionnaireQuestionKind = Object.freeze(["single", "multiple", "text"] as const);

/** One kind of questionnaire question. */
export type QuestionnaireQuestionKind = (typeof QuestionnaireQuestionKind)[number];
