/**
 * Stackra file contract:
 * Purpose: `searchFacetHashOf(facet)`, the SHA-256 (hex) of a model's `@Searchable` facet: its text paths in order,
 *          its filter paths as a set and whether it is semantic. The registry stores it per index, and a changed hash
 *          marks the index invalid, which is Magento's "invalid" after a configuration change.
 * Boundary: pure; reads only the facet. Text order is weight, so it counts; filter order does not.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0294 (decision 6: `@Searchable`).
 */
import { createHash } from "node:crypto";

import type { SearchableOptions } from "@stackra/model";

/**
 * The hash of `facet`.
 *
 * @example
 * searchFacetHashOf(Searchable.on(Product)); // "9f2c…" (64 hex characters)
 */
export function searchFacetHashOf(facet: SearchableOptions): string {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
  const filters = [...(facet.filters ?? [])].sort();
  return createHash("sha256")
    .update(JSON.stringify({ text: facet.text, filters, semantic: facet.semantic === true }))
    .digest("hex");
}
