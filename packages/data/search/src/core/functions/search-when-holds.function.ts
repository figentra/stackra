/**
 * Stackra file contract:
 * Purpose: `searchWhenHolds`, whether a loaded row is searchable under its facet's `when` condition: each named field
 *          holds one of its listed values.
 * Boundary: pure over the row; internal to this package. A date compares as its ISO 8601 string. A row of a facet
 *           without `when` is always searchable.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); data-layer gap se9 (stackra-302: Scout's `shouldBeSearchable`).
 */
import type { SearchableOptions } from "@stackra/model";

import { searchValuesAt } from "#core/functions/search-values-at.function";

/**
 * Whether `row` has a document under `facet`.
 *
 * @example
 * searchWhenHolds({ status: "draft" }, { text: ["title"], when: { status: ["active"] } }); // false
 */
export function searchWhenHolds(row: object, facet: SearchableOptions): boolean {
  return Object.entries(facet.when ?? {}).every(([path, allowed]) =>
    searchValuesAt(row, path).some((value) => {
      const held = value instanceof Date ? value.toISOString() : value;
      return allowed.some((one) => one === held);
    }),
  );
}
