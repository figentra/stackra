/**
 * Stackra file contract:
 * Purpose: unit tests of `searchDocumentOf`: text fields in declared order as normalised words, a translated field as
 *          one text per locale (also while it holds a factory's plain map), relation paths spread over arrays and
 *          unwrapped references, rich-text leaves, and filter values with dates as ISO strings and objects left out.
 * Boundary: test only; rows are model instances with plain arrays standing in for populated collections.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1 to 3); ADR 0162.
 */
import { Model, Translatable, Translated } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { searchDocumentOf } from "#core/functions/search-document-of.function";

class Product extends Model.with(Translatable(["title"])) {
  title: Translated | Readonly<Record<string, string>> = Translated.of({ en: "Shirt" });

  status = "draft";

  body: object | null = null;

  variants: readonly { readonly sku: string; readonly stock: number }[] = [];

  collections: readonly { readonly slug: string }[] = [];

  brand: { readonly unwrap: () => { readonly name: string } } | null = null;

  createdAt = new Date("2026-10-24T08:00:00.000Z");
}

/** A product with the given fields. */
const productWith = (fields: Partial<Product>): Product => Object.assign(new Product(), fields);

describe(searchDocumentOf, () => {
  it("writes the text fields in order and the filters by path", () => {
    const product = productWith({
      title: Translated.of({ en: "Linen Shirt", ar: "قَمِيص كتان" }),
      status: "active",
      variants: [
        { sku: "AB-1", stock: 3 },
        { sku: "CD-2", stock: 0 },
      ],
      collections: [{ slug: "summer" }, { slug: "sale" }],
    });
    expect(
      searchDocumentOf(product, "prd_1", {
        text: ["title", "variants.sku"],
        filters: ["status", "collections.slug", "variants.stock", "createdAt"],
      }),
    ).toEqual({
      id: "prd_1",
      fields: [{ en: "linen shirt", ar: "قميص كتان" }, "ab 1 cd 2"],
      filters: {
        status: ["active"],
        "collections.slug": ["summer", "sale"],
        "variants.stock": [3, 0],
        createdAt: ["2026-10-24T08:00:00.000Z"],
      },
    });
  });

  it("reads a translated field that still holds a plain locale map", () => {
    const product = productWith({ title: { en: "Mug", ar: "كوب" } });
    expect(searchDocumentOf(product, "prd_2", { text: ["title"] }).fields).toEqual([
      { en: "mug", ar: "كوب" },
    ]);
  });

  it("unwraps a reference, reads rich-text leaves and skips what is missing", () => {
    const product = productWith({
      brand: { unwrap: () => ({ name: "Acme Co" }) },
      body: { type: "doc", children: [{ type: "paragraph", text: "Soft cotton" }] },
    });
    expect(
      searchDocumentOf(product, "prd_3", {
        text: ["brand.name", "body", "variants.sku"],
        filters: ["body", "brand.name"],
      }),
    ).toEqual({
      id: "prd_3",
      fields: ["acme co", "soft cotton", ""],
      filters: { body: [], "brand.name": ["Acme Co"] },
    });
  });
});
