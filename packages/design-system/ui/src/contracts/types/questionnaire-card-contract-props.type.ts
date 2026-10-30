/**
 * Stackra file contract:
 * Purpose: `QuestionnaireCardContractProps`, the props every runtime's `QuestionnaireCard` takes: the questions an
 *          assistant asks one at a time, the answers to start from, and what to do with the answers once reviewed.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { QuestionnaireAnswers } from "#contracts/types/questionnaire-answers.type";
import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";

/** Props shared by the web and native `QuestionnaireCard`. */
export interface QuestionnaireCardContractProps {
  /** The card's title, for example "A few questions before I draft the offer". */
  readonly title: string;
  /** A muted line under the title. */
  readonly description?: string | undefined;
  /** The questions, asked in this order, one per step; a summary of the answers follows the last. */
  readonly questions: readonly QuestionnaireQuestion[];
  /** Answers to start from, for example the ones given last time. */
  readonly defaultAnswers?: QuestionnaireAnswers | undefined;
  /** Called with the answers when the person sends them from the summary. */
  readonly onSubmit: (answers: QuestionnaireAnswers) => void;
  /** The send button's words. Defaults to the catalogue's "Send answers". */
  readonly submitLabel?: string | undefined;
  /** True while the answers are being sent: the send button shows a spinner and refuses presses. */
  readonly isSubmitting?: boolean | undefined;
}
