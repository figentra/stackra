/**
 * Stackra file contract:
 * Purpose: unit tests of `searchRerankTextOf`: the row's own text fields as written and in the facet's order, a translated
 *          field in the asked locale, a dotted path and a non-text value left out, and the text cut at its limit.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 4).
 */
import { Translated } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { searchRerankTextOf } from "#core/functions/search-rerank-text-of.function";

describe(searchRerankTextOf, () => {
  it("joins the own text fields as written, in the facet's order", () => {
    const row = { title: "Linen Shirt", note: "Summer", price: 12, empty: "" };
    expect(searchRerankTextOf(row, { text: ["title", "empty", "note", "price"] })).toBe(
      "Linen Shirt\nSummer",
    );
  });

  it("reads a translated field in the locale and leaves a relation path out", () => {
    const row = { title: Translated.of({ en: "Shirt", ar: "قميص" }), variants: [{ sku: "A" }] };
    expect(searchRerankTextOf(row, { text: ["title", "variants.sku"] }, "ar")).toBe("قميص");
    expect(searchRerankTextOf(row, { text: ["title", "variants.sku"] }, "en")).toBe("Shirt");
  });

  it("cuts a long text", () => {
    expect(searchRerankTextOf({ body: "x".repeat(5000) }, { text: ["body"] })).toHaveLength(1500);
  });
});
