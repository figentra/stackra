/**
 * Stackra file contract:
 * Purpose: `QuestionnaireAnswers`, what a `QuestionnaireCard` reports: by question id, the chosen option's value (or
 *          the "Other" text) for `single` and `text` questions, and the list of values (the "Other" text last) for
 *          `multiple` ones. A skipped question is left out.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The answers of a questionnaire, by question id. */
export type QuestionnaireAnswers = Readonly<Record<string, string | readonly string[]>>;
