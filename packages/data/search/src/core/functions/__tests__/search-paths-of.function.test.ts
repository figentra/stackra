/**
 * Stackra file contract:
 * Purpose: unit tests of `searchPathsOf`: every kind of facet path once, text first.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; stackra-302.
 */
import { describe, expect, it } from "@stackra/testing";

import { searchPathsOf } from "#core/functions/search-paths-of.function";

describe(searchPathsOf, () => {
  it("lists text, filter, sortable, range and when paths once each", () => {
    expect(
      searchPathsOf({
        text: ["title", "variants.sku"],
        filters: ["status", "price"],
        sortable: ["price", "publishedAt"],
        ranges: ["price"],
        when: { status: ["active"], visibleFrom: ["now"] },
      }),
    ).toEqual(["title", "variants.sku", "status", "price", "publishedAt", "visibleFrom"]);
  });

  it("lists the text alone for a plain facet", () => {
    expect(searchPathsOf({ text: ["title"] })).toEqual(["title"]);
  });
});
