/**
 * Stackra file contract:
 * Purpose: `Recommendation`, one item a `Recommender` suggests: its id and a score.
 * Boundary: a type only. The id is the item's public id as the indexed row carries it; the score orders one answer
 *           (higher first) and is not comparable across kinds or drivers.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8: the `Recommender` port).
 */

/** One suggested item. */
export interface Recommendation {
  /** The suggested item's id. */
  readonly id: string;

  /** How strongly it is suggested; higher first. */
  readonly score: number;
}
