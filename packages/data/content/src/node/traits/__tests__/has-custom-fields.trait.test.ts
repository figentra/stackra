/**
 * Stackra file contract:
 * Purpose: unit tests of `HasCustomFields`: a trait named `has_custom_fields` with no options, recorded in the trait
 *          registry of a model that uses it, which gains no field from it.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0321 (decision 2); ADR 0096.
 */
import { HasPublicId, Model, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { HasCustomFields } from "#node/traits/has-custom-fields.trait";

/** A model that takes custom fields. */
class Product extends Model.with(HasPublicId("prd"), HasCustomFields) {}

describe("HasCustomFields", () => {
  it("is the has_custom_fields trait with no options", () => {
    expect(HasCustomFields.traitName).toBe("has_custom_fields");
    expect(HasCustomFields.options).toEqual({});
  });

  it("is recorded on a model that uses it and adds no field", () => {
    expect(traitsOf(Product).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "has_custom_fields",
    ]);
    expect(Object.keys(new Product())).toEqual(["id"]);
  });
});
