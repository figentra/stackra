/**
 * Stackra file contract:
 * Purpose: `SearchEvaluationQuery`, one judged shopper query: its phrase, locale, script mix and graded relevance labels.
 * Boundary: a type only, in the `./testing` entry. A grade is 2 for the best answers, 1 for acceptable ones; an id not listed
 *           grades 0.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5 and enforcement: a fixed evaluation set of Arabic, English and mixed queries).
 */

/** One judged query. */
export interface SearchEvaluationQuery {
  /** The phrase as a shopper types it. */
  readonly query: string;

  /** The shopper's locale (`en`, `ar`); `mixed` queries use the Arabic locale. */
  readonly locale: "en" | "ar";

  /** The language mix of the phrase. */
  readonly script: "english" | "arabic" | "mixed";

  /** The relevance grade of each relevant product, by id. */
  readonly grades: Readonly<Record<string, number>>;
}
