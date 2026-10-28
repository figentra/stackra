/**
 * Stackra file contract:
 * Purpose: `searchPathsOf`, every path a model's search document reads: its text, filter, sortable and range fields
 *          and the fields its `when` condition tests, each once.
 * Boundary: pure over the facet; internal to this package. The change consumers, the relation hops and the populate
 *           hints all read it, so a new facet field kind joins here and nowhere else.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5); data-layer gaps se3, se4 and se9 (stackra-302).
 */
import type { SearchableOptions } from "@stackra/model";

/**
 * The distinct paths `facet` reads, text first.
 *
 * @example
 * searchPathsOf({ text: ["title"], sortable: ["price"], when: { status: ["active"] } }); // ["title", "price", "status"]
 */
export function searchPathsOf(facet: SearchableOptions): readonly string[] {
  return [
    ...new Set([
      ...facet.text,
      ...(facet.filters ?? []),
      ...(facet.sortable ?? []),
      ...(facet.ranges ?? []),
      ...Object.keys(facet.when ?? {}),
    ]),
  ];
}
