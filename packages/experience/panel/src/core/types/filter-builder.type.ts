/**
 * Stackra file contract:
 * Purpose: `FilterBuilder`, one filter under construction: its starting value and whether it is pinned beside search.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2).
 */
import type { Built } from "#core/types/built.type";
import type { FilterNode } from "#core/types/filter-node.type";

/** The chainable builder of one table filter. */
export interface FilterBuilder extends Built<FilterNode> {
  /** The value the filter starts with on the Default view. */
  default: (value: unknown) => this;

  /** Pins the filter beside the search box. */
  pinned: () => this;
}
