/**
 * Stackra file contract:
 * Purpose: unit tests of `@ManyToMany`: the target and the pivot table are recorded; a pivot table that is not
 *          snake_case is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 6 and 11); ADR 0231.
 */
import { Collection } from "@mikro-orm/core";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { ManyToMany } from "#core/decorators/many-to-many.decorator";
import { HasPublicId } from "#core/traits/has-public-id.trait";

class ProductCollection extends Model.with(HasPublicId("pcl")) {}

class Product extends Model.with(HasPublicId("prd")) {
  @ManyToMany(() => ProductCollection, { pivotTable: "product_collection_items" })
  collections = new Collection<ProductCollection>(this);
}

describe(ManyToMany, () => {
  it("records the target and the pivot table", () => {
    const relation = ManyToMany.members(Product).get("collections");
    expect(relation?.target()).toBe(ProductCollection);
    expect(relation?.pivotTable).toBe("product_collection_items");
  });

  it("refuses a pivot table that is not snake_case", () => {
    expect(() => ManyToMany(() => ProductCollection, { pivotTable: "ProductItems" })).toThrow(
      TypeError,
    );
  });
});
