/**
 * Stackra file contract:
 * Purpose: `VectorHit`, one passage a `VectorIndex` query found: its id, how close it is, its text and its metadata.
 * Boundary: a type only. `score` is the cosine similarity of the query and the passage, from -1 to 1, the higher the
 *           closer; hits arrive best first.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (pgvector); owner decision 23.
 */
import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** One query result. */
export interface VectorHit {
  /** The passage's id. */
  readonly id: string;

  /** The cosine similarity to the query vector. */
  readonly score: number;

  /** The passage's text. */
  readonly text: string;

  /** The passage's metadata. */
  readonly metadata: Readonly<Record<string, SearchFilterValue>>;
}
