/**
 * Stackra file contract:
 * Purpose: `searchFacetHashOf(facet)`, the SHA-256 (hex) of a model's `@Searchable` facet: its text paths in order,
 *          its filter paths as a set and whether it is semantic, and, when declared, its sortable and range paths as
 *          sets, its text weights and its `when` condition (stackra-302). The registry stores it per index, and a changed hash
 *          marks the index invalid, which is Magento's "invalid" after a configuration change.
 * Boundary: pure; reads only the facet. Text order is weight, so it counts; filter order does not.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0294 (decision 6: `@Searchable`).
 */
import { createHash } from "node:crypto";

import type { SearchableOptions } from "@stackra/model";

/** `values` sorted, as a set compares. */
// oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
const setOf = (values: readonly string[]): string[] => [...values].sort();

/**
 * The hash of `facet`.
 *
 * @example
 * searchFacetHashOf(Searchable.on(Product)); // "9f2c…" (64 hex characters)
 */
export function searchFacetHashOf(facet: SearchableOptions): string {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
  const filters = [...(facet.filters ?? [])].sort();
  // The field kinds join only when declared, so a facet without them keeps the hash it had before them.
  const kinds = {
    ...(facet.sortable === undefined ? {} : { sortable: setOf(facet.sortable) }),
    ...(facet.ranges === undefined ? {} : { ranges: setOf(facet.ranges) }),
    ...(facet.boost === undefined
      ? {}
      : { boost: facet.text.map((path) => facet.boost?.[path] ?? "") }),
    ...(facet.when === undefined
      ? {}
      : {
          when: setOf(Object.keys(facet.when)).map((path) => [
            path,
            setOf((facet.when?.[path] ?? []).map(String)),
          ]),
        }),
  };
  return createHash("sha256")
    .update(
      JSON.stringify({ text: facet.text, filters, semantic: facet.semantic === true, ...kinds }),
    )
    .digest("hex");
}
