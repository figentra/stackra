/**
 * Stackra file contract:
 * Purpose: `SearchEvaluationProduct`, one row of the evaluation catalogue: an English and an Arabic title and description.
 * Boundary: a type only, in the `./testing` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5 and enforcement: a fixed evaluation set of Arabic, English and mixed queries).
 */

/** One catalogue row. */
export interface SearchEvaluationProduct {
  /** The row's key. */
  readonly id: string;

  /** The English title. */
  readonly title: string;

  /** The Arabic title. */
  readonly titleAr: string;

  /** The English description. */
  readonly description: string;

  /** The Arabic description. */
  readonly descriptionAr: string;
}
