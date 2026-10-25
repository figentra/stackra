/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RuleSet`: a model with the `rset` public id, the timestamps and content's
 *          `HasRevisions`, a fresh id per row, and the types of its scope and consumer fields.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decision 5); ADR 0321 (decision 2); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RuleSet } from "#node/models/rule-set.model";

describe("RuleSet", () => {
  it("is a model with the rset public id, the timestamps and revisions", () => {
    expect(new RuleSet()).toBeInstanceOf(Model);
    expect(traitsOf(RuleSet).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
      "has_revisions",
    ]);
    expect(traitsOf(RuleSet)[0]?.options).toEqual({ prefix: "rset" });
  });

  it("mints a fresh rset id per row", () => {
    const first = new RuleSet();
    expect(first.id).toMatch(/^rset_[0-9a-z]{26}$/);
    expect(new RuleSet().id).not.toBe(first.id);
  });

  it("types its scope and its consumer", () => {
    expectTypeOf<RuleSet["id"]>().toEqualTypeOf<PublicId<"rset">>();
    expectTypeOf<RuleSet["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
    expectTypeOf<RuleSet["consumer"]>().toEqualTypeOf<string>();
  });
});
