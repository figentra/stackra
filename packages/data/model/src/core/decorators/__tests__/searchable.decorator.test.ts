/**
 * Stackra file contract:
 * Purpose: unit tests of `@Searchable`: the declared text and filter fields read back frozen, with `semantic`,
 *          `sortable`, `ranges`, `boost` and `when` kept when given; refused without a text field, for a boost of a
 *          path that is not text, for a `when` field with no value, or on a class that is not a model.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0221; ADR 0294 (decision 6); STA-1326.
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { Searchable } from "#core/decorators/searchable.decorator";

@Searchable({
  text: ["title", "variants.sku"],
  filters: ["status"],
})
class Product extends Model.with() {
  title!: string;

  status!: string;
}

describe(Searchable, () => {
  it("records the search index", () => {
    expect(Searchable.on(Product)).toEqual({
      text: ["title", "variants.sku"],
      filters: ["status"],
    });
    expect(Object.isFrozen(Searchable.on(Product)?.text)).toBe(true);
  });

  it("records no filters when none are given", () => {
    @Searchable({ text: ["target"] })
    class AccessLogEntry extends Model.with() {}
    expect(Searchable.on(AccessLogEntry)).toEqual({ text: ["target"] });
  });

  it("keeps semantic in the frozen options", () => {
    @Searchable({
      text: ["body"],
      semantic: true,
    })
    class CaseNote extends Model.with() {}
    @Searchable({
      text: ["body"],
      semantic: false,
    })
    class Memo extends Model.with() {}
    expect(Searchable.on(CaseNote)).toEqual({ text: ["body"], semantic: true });
    expect(Object.isFrozen(Searchable.on(CaseNote))).toBe(true);
    expect(Searchable.on(Memo)?.semantic).toBe(false);
  });

  it("keeps the field kinds frozen", () => {
    @Searchable({
      text: ["title", "variants.sku"],
      filters: ["status"],
      sortable: ["price", "publishedAt"],
      ranges: ["price"],
      boost: { "variants.sku": "A" },
      when: { status: ["active", "featured"] },
    })
    class Listing extends Model.with() {}
    const facet = Searchable.on(Listing);
    expect(facet).toEqual({
      text: ["title", "variants.sku"],
      filters: ["status"],
      sortable: ["price", "publishedAt"],
      ranges: ["price"],
      boost: { "variants.sku": "A" },
      when: { status: ["active", "featured"] },
    });
    expect(Object.isFrozen(facet?.sortable)).toBe(true);
    expect(Object.isFrozen(facet?.boost)).toBe(true);
    expect(Object.isFrozen(facet?.when?.["status"])).toBe(true);
  });

  it("refuses a boost of a field that is not text and a when field with no value", () => {
    expect(() => Searchable({ text: ["title"], boost: { status: "A" } })).toThrow(TypeError);
    expect(() => Searchable({ text: ["title"], when: { status: [] } })).toThrow(TypeError);
  });

  it("refuses an empty text list and a class that is not a model", () => {
    expect(() => Searchable({ text: [] })).toThrow(TypeError);
    class Plain {}
    expect(() => Searchable({ text: ["name"] })(Plain as AnyClass)).toThrow(TypeError);
  });
});
