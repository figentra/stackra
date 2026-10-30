/**
 * Stackra file contract:
 * Purpose: `RerankCandidate`, one fused search hit a `Reranker` reads: its id and the text the model judges.
 * Boundary: a type only. The text is the row's own searchable text (never folded), already cut to what a reranker can
 *           read; the id is returned untouched.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 4: the reranker); ADR 0221.
 */

/** One candidate of a rerank. */
export interface RerankCandidate {
  /** The row's primary key, as the driver returned it. */
  readonly id: string;

  /** The text the query is judged against. */
  readonly text: string;
}
