/**
 * Stackra file contract:
 * Purpose: `QuestionnaireDraft`, a QuestionnaireCard question's answer while it is edited: the chosen option values
 *          (or the typed text of a `text` question) and the "Other" text, `null` while "Other" is not chosen.
 * Boundary: types only; `questionnaireDraftOf` and `questionnaireAnswerOf` convert to and from the reported answer.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** One question's answer being edited. */
export interface QuestionnaireDraft {
  /** The chosen option values, or the text of a `text` question as the one value. */
  readonly values: readonly string[];
  /** The "Other" text; `null` while "Other" is not chosen, `""` while it is chosen and empty. */
  readonly other: string | null;
}
