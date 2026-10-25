/**
 * Stackra file contract:
 * Purpose: unit tests of `HasRevisions`: a trait named `has_revisions` with no options, recorded in the trait registry
 *          of a model that uses it, which gains no field from it.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0321 (decision 2); ADR 0096.
 */
import { HasPublicId, Model, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { HasRevisions } from "#node/traits/has-revisions.trait";

/** A model that keeps revisions. */
class Page extends Model.with(HasPublicId("pag"), HasRevisions) {}

describe("HasRevisions", () => {
  it("is the has_revisions trait with no options", () => {
    expect(HasRevisions.traitName).toBe("has_revisions");
    expect(HasRevisions.options).toEqual({});
  });

  it("is recorded on a model that uses it and adds no field", () => {
    expect(traitsOf(Page).map((trait) => trait.name)).toEqual(["has_public_id", "has_revisions"]);
    expect(Object.keys(new Page())).toEqual(["id"]);
  });
});
