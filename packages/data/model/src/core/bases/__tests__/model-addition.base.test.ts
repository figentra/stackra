/**
 * Stackra file contract:
 * Purpose: unit tests of `ModelAddition`: an addition is a model of the `model_addition` kind that knows its base,
 *          takes model decorators, and a plain model has no base.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0336 (decisions 1 and 6).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { ModelAddition } from "#core/bases/model-addition.base";
import { Index } from "#core/decorators/index.decorator";

class Product extends Model {}

@Index(["fit"])
class ProductAddition extends ModelAddition(Product) {
  fit = "regular";
}

describe(ModelAddition, () => {
  it("records its base and is a model", () => {
    expect(new ProductAddition()).toBeInstanceOf(Model);
    expect(kindOf(ProductAddition)?.kind).toBe("model_addition");
    expect(ModelAddition.baseOf(ProductAddition)).toBe(Product);
    expect(ModelAddition.baseOf(Product)).toBeUndefined();
    expect(Index.on(ProductAddition)[0]?.properties).toEqual(["fit"]);
  });
});
