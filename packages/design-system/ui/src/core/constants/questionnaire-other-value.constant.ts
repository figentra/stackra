/**
 * Stackra file contract:
 * Purpose: `QUESTIONNAIRE_OTHER_VALUE`, the value of the "Other" radio or checkbox a QuestionnaireCard adds; it never
 *          reaches the reported answers (the typed text does).
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The "Other" option's value. */
export const QUESTIONNAIRE_OTHER_VALUE = "__stackra_other__";
