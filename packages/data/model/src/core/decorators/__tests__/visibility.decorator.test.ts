/**
 * Stackra file contract:
 * Purpose: unit tests of `@Visibility`: the declared attributes and followed relations read back frozen, a subclass
 *          finds its base's declaration, and a declaration with no name, a bad or repeated name, or on a class that is
 *          not a model is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0333 (decisions 1 and 4, and its amendment); ADR 0294
 *                     (decision 6).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { Visibility } from "#core/decorators/visibility.decorator";

@Visibility({ attributes: ["collection", "status"] })
class Product extends Model.with() {
  collection!: string;

  status!: string;
}

@Visibility({ follows: ["matter"] })
class Document extends Model.with() {}

describe(Visibility, () => {
  it("records the attributes and the followed relations", () => {
    expect(Visibility.on(Product)).toEqual({ attributes: ["collection", "status"] });
    expect(Object.isFrozen(Visibility.on(Product)?.attributes)).toBe(true);
    expect(Visibility.on(Document)).toEqual({ follows: ["matter"] });
  });

  it("is found on a subclass and absent on an undeclared model", () => {
    class SaleProduct extends Product {}
    class Invoice extends Model.with() {}
    expect(Visibility.on(SaleProduct)?.attributes).toEqual(["collection", "status"]);
    expect(Visibility.on(Invoice)).toBeUndefined();
  });

  it("refuses an empty declaration, a bad or repeated name and a class that is not a model", () => {
    expect(() => Visibility({})).toThrow(TypeError);
    expect(() => Visibility({ attributes: [], follows: [] })).toThrow(TypeError);
    expect(() => Visibility({ attributes: ["matter.status"] })).toThrow(TypeError);
    expect(() => Visibility({ attributes: ["Status"] })).toThrow(TypeError);
    expect(() => Visibility({ follows: ["matter", "matter"] })).toThrow(TypeError);
    class Plain {}
    expect(() => Visibility({ attributes: ["status"] })(Plain as AnyClass)).toThrow(TypeError);
  });
});
