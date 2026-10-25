/**
 * Stackra file contract:
 * Purpose: unit tests of `Schedulable`: it adds no field and is recorded with no options.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0321 (decision 6).
 */
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { HasRevisions } from "#node/traits/has-revisions.trait";
import { Schedulable } from "#node/traits/schedulable.trait";

class Product extends Model.with(HasPublicId("prd"), HasRevisions, Schedulable) {}

describe("Schedulable", () => {
  it("adds no field", () => {
    expect(Schedulable.traitName).toBe("schedulable");
    expect(Object.keys(new Product())).toEqual(["id"]);
  });
});
