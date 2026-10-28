/**
 * Stackra file contract:
 * Purpose: unit tests of `searchRelationsOf`: each relation hop of a dotted facet path names its child, its path and
 *          the fields read next plus the child's relation fields; a scalar or embedded segment ends the walk; hops
 *          through the same relation merge.
 * Boundary: test only; real models with relation decorators, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 5); data-layer gap se4.
 */
import { Collection, ManyToOne, Model, OneToMany, Searchable } from "@stackra/model";
import type { Ref } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { searchRelationsOf } from "#node/functions/search-relations-of.function";

class Option extends Model.with() {
  @ManyToOne(() => Variant)
  variant!: Ref<Variant>;
}

class Variant extends Model.with() {
  @ManyToOne(() => Product)
  product!: Ref<Product>;

  @OneToMany(() => Option, (option) => option.variant)
  options = new Collection<Option>(this);
}

@Searchable({
  text: ["title", "variants.sku", "variants.options.label", "meta.summary"],
  filters: ["variants.color"],
})
class Product extends Model.with() {
  @OneToMany(() => Variant, (variant) => variant.product)
  variants = new Collection<Variant>(this);
}

class Plain extends Model.with() {}

describe("searchRelationsOf", () => {
  it("names each hop with the fields it reads and stops at a non-relation", () => {
    const relations = searchRelationsOf(Product);
    expect(relations).toHaveLength(2);
    const [variants, options] = relations;
    expect(variants?.parent).toBe(Product);
    expect(variants?.child).toBe(Variant);
    expect(variants?.via).toEqual(["variants"]);
    expect([...(variants?.reads ?? [])].sort()).toEqual(["color", "options", "product", "sku"]);
    expect(options?.child).toBe(Option);
    expect(options?.via).toEqual(["variants", "options"]);
    expect([...(options?.reads ?? [])].sort()).toEqual(["label", "variant"]);
  });

  it("gives none for a model without a facet or dotted relation paths", () => {
    expect(searchRelationsOf(Plain)).toEqual([]);
  });
});
