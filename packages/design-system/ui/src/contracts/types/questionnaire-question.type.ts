/**
 * Stackra file contract:
 * Purpose: `QuestionnaireQuestion`, one question a `QuestionnaireCard` asks: its id, words, kind, options and whether
 *          it takes an "Other" answer or may be skipped.
 * Boundary: types only; the words are the app's, already in the reader's language.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { QuestionnaireQuestionKind } from "#contracts/enums/questionnaire-question-kind.enum";
import type { ChoiceOption } from "#contracts/types/choice-option.type";

/** One question of a questionnaire. */
export interface QuestionnaireQuestion {
  /** The key the question's answer is reported under; unique within the questionnaire. */
  readonly id: string;
  /** The question itself, for example "Which branches should the offer run in?". */
  readonly title: string;
  /** A muted line under the question that helps answer it. */
  readonly description?: string | undefined;
  /** `single` picks one option, `multiple` several, `text` takes free text. */
  readonly kind: QuestionnaireQuestionKind;
  /** The options of a `single` or `multiple` question, in the order drawn. */
  readonly options?: readonly ChoiceOption[] | undefined;
  /** True to add an "Other" option with a text field of its own (`single` and `multiple`). */
  readonly allowsOther?: boolean | undefined;
  /** True when the question cannot be skipped; Next waits for an answer. */
  readonly isRequired?: boolean | undefined;
  /** Hint text inside the empty text field of a `text` question. */
  readonly placeholder?: string | undefined;
}
