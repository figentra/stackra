/**
 * Stackra file contract:
 * Purpose: `SearchBoost`, one ranking rule that lifts the matches holding a filter value (`featured=true` times 2).
 * Boundary: a type only, read from the `search.rankingRules` setting, never from request input. It multiplies a
 *           match's relevance and never adds a row that does not match.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); ADR 0307 (rules 22 to 24: runtime values are settings); data-layer gap
 *                     se11 (stackra-326).
 */
import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** One boost rule. */
export interface SearchBoost {
  /** The filter, sortable or range path whose stored values are tested. */
  readonly path: string;

  /** The value a match must hold to be lifted. */
  readonly value: SearchFilterValue;

  /** The factor its relevance is multiplied by, above 0 and at most 10 (below 1 sinks it). */
  readonly factor: number;
}
