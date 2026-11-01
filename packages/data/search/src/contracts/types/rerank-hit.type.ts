/**
 * Stackra file contract:
 * Purpose: `RerankHit`, one reranked candidate: its id and the relevance score the model gave it.
 * Boundary: a type only. A score is comparable within one call only; a higher score ranks first.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 4: the reranker); ADR 0221.
 */

/** One reranked candidate. */
export interface RerankHit {
  /** The candidate's id. */
  readonly id: string;

  /** The relevance the model gave it for the query. */
  readonly score: number;
}
