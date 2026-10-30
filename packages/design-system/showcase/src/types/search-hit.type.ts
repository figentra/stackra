/**
 * Stackra file contract:
 * Purpose: `SearchHit`, one result of `matchEntries`: the doc, its score and why it matched.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5; ADR 0305 (one declaration per file).
 */
import type { SearchDoc } from "#src/types/search-doc.type";

/** One search result. */
export interface SearchHit {
  readonly doc: SearchDoc;
  /** Higher is better. */
  readonly score: number;
  /** What matched: shown beside the result ("prop: isLoading"). */
  readonly reason: "title" | "keyword" | "description" | "heading" | "prop";
  /** The matching text: the keyword, heading or prop name. */
  readonly matched: string;
}
