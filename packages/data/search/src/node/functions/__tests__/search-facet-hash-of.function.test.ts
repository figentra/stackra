/**
 * Stackra file contract:
 * Purpose: unit tests of `searchFacetHashOf`: 64 hex characters, stable under filter order, changed by text order, a
 *          new path or the semantic flag.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0404 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";

describe(searchFacetHashOf, () => {
  const base = searchFacetHashOf({ text: ["title", "sku"], filters: ["status", "brand"] });

  it("is a SHA-256 in hex, stable under filter order", () => {
    expect(base).toMatch(/^[0-9a-f]{64}$/);
    expect(searchFacetHashOf({ text: ["title", "sku"], filters: ["brand", "status"] })).toBe(base);
  });

  it("changes with text order, a new path or the semantic flag", () => {
    expect(searchFacetHashOf({ text: ["sku", "title"], filters: ["status", "brand"] })).not.toBe(
      base,
    );
    expect(
      searchFacetHashOf({ text: ["title", "sku"], filters: ["status", "brand", "color"] }),
    ).not.toBe(base);
    expect(
      searchFacetHashOf({ text: ["title", "sku"], filters: ["status", "brand"], semantic: true }),
    ).not.toBe(base);
  });

  it("keeps its hash without field kinds and changes when one is declared or changed", () => {
    const facet = { text: ["title", "sku"], filters: ["status", "brand"] };
    const sorted = searchFacetHashOf({ ...facet, sortable: ["price", "createdAt"] });
    expect(sorted).not.toBe(base);
    expect(searchFacetHashOf({ ...facet, sortable: ["createdAt", "price"] })).toBe(sorted);
    expect(searchFacetHashOf({ ...facet, ranges: ["price"] })).not.toBe(base);
    expect(searchFacetHashOf({ ...facet, boost: { sku: "A" } })).not.toBe(base);
    const when = searchFacetHashOf({ ...facet, when: { status: ["active"] } });
    expect(when).not.toBe(base);
    expect(searchFacetHashOf({ ...facet, when: { status: ["active", "featured"] } })).not.toBe(
      when,
    );
  });
});
