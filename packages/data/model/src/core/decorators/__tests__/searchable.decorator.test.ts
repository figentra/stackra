/**
 * Stackra file contract:
 * Purpose: unit tests of `@Searchable`: the declared text and filter fields read back frozen, with `semantic` kept
 *          when given; refused without a text field or on a class that is not a model.
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

  it("refuses an empty text list and a class that is not a model", () => {
    expect(() => Searchable({ text: [] })).toThrow(TypeError);
    class Plain {}
    expect(() => Searchable({ text: ["name"] })(Plain as AnyClass)).toThrow(TypeError);
  });
});
