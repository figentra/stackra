/**
 * Stackra file contract:
 * Purpose: `SearchRules`, the ranking rules of one index that apply to one phrase, as `searchRulesOf` reads them from
 *          the `search.rankingRules` setting.
 * Boundary: a type only, internal to this package; `SearchIndex` passes its members on as `SearchRequest` fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0221; ADR 0307 (rules 22 to 24); data-layer gap se11 (stackra-326).
 */
import type { SearchBoost, SearchRecency } from "#contracts/index";

/** The rules of one phrase. */
export interface SearchRules {
  /** The row ids ranked first, in order. */
  readonly pinned: readonly string[];

  /** The row ids never ranked. */
  readonly hidden: readonly string[];

  /** The boosts applied when ranking. */
  readonly boosts: readonly SearchBoost[];

  /** The recency decay; absent when none is set. */
  readonly recency?: SearchRecency;
}
