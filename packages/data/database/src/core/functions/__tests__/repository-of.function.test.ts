/**
 * Stackra file contract:
 * Purpose: unit tests of `repositoryOf`: one class token per model, reused, named after the model, a `CrudService`
 *          whose registered model is the one given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0145 and ADR 0263 as amended by ADR 0294; ADR 0022; ADR 0269.
 */
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { CrudService } from "#core/bases/crud-service.base";
import { modelOf } from "#core/functions/model-of.function";
import { repositoryOf } from "#core/functions/repository-of.function";

class Variant extends Model.with(HasPublicId("var")) {}

class Product extends Model.with(HasPublicId("prd")) {}

describe(repositoryOf, () => {
  it("makes one token per model and registers its model", () => {
    const token = repositoryOf(Variant);
    expect(repositoryOf(Variant)).toBe(token);
    expect(repositoryOf(Product)).not.toBe(token);
    expect(token.name).toBe("VariantRepository");
    expect(token.prototype).toBeInstanceOf(CrudService);
    expect(modelOf(token)).toBe(Variant);
  });
});
